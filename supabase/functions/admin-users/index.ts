// JFRESH OS · admin-users Edge Function
// Team accounts for mode asli. Only a signed-in account with the sys.users
// permission may call it.
//
//   create        { email, password, name, position?, department?, phone?, employee_id?, roles[], default_role, plants[], all_plants? }
//                 employee_id links the account to an employee HR already registered.
//   set_password  { user_id, password }
//
// The Auth user is created with the service role (that is the only thing the
// service role does here). The employee record, profile, roles and plants are
// written with the CALLER's token, so the database guards apply: nobody grants
// the owner role, full access or all plants unless they have full access, and
// nobody changes their own access.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const fail = (status: number, code: string, error: string) => json(status, { ok: false, code, error });

const URL_ = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return fail(405, "method", "POST only");
  const authz = req.headers.get("Authorization") ?? "";
  if (!authz.startsWith("Bearer ")) return fail(401, "nosession", "not signed in");

  const caller = createClient(URL_, ANON, { global: { headers: { Authorization: authz } }, auth: { persistSession: false } });
  const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

  const { data: me } = await caller.auth.getUser();
  if (!me?.user) return fail(401, "nosession", "not signed in");
  const { data: allowed } = await caller.rpc("has_perm", { p_key: "sys.users" });
  if (!allowed) return fail(403, "noperm", "sys.users required");
  const { data: full } = await caller.rpc("is_full_access");

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return fail(400, "bad", "invalid JSON"); }
  const action = String(b.action ?? "");

  if (action === "set_password") {
    const userId = String(b.user_id ?? ""), password = String(b.password ?? "");
    if (password.length < 8) return fail(400, "pw_short", "password must be at least 8 characters");
    if (userId === me.user.id) return fail(400, "self", "use Profile to change your own password");
    const { data: target } = await caller.from("profiles").select("id,email,full_access").eq("id", userId).maybeSingle();
    if (!target) return fail(404, "missing", "account not found");
    if (target.full_access && !full) return fail(403, "noperm", "only a full-access user can change this account");
    const { error } = await admin.auth.admin.updateUserById(userId, { password, user_metadata: { must_change_password: true } });
    if (error) return fail(400, "system", error.message);
    await caller.rpc("log_event", { p_event: "ACC.PW_RESET", p_target: target.email, p_details: {} });
    return json(200, { ok: true });
  }

  if (action === "create") {
    const email = String(b.email ?? "").trim().toLowerCase();
    const password = String(b.password ?? "");
    const name = String(b.name ?? "").trim();
    const roles = Array.isArray(b.roles) ? (b.roles as unknown[]).map(String) : [];
    const defRole = String(b.default_role ?? roles[0] ?? "");
    const plants = Array.isArray(b.plants) ? (b.plants as unknown[]).map(String) : [];
    const allPlants = !!b.all_plants;
    if (!EMAIL.test(email)) return fail(400, "email", "invalid email");
    if (!name) return fail(400, "name", "name required");
    if (password.length < 8) return fail(400, "pw_short", "password must be at least 8 characters");
    if (!roles.length || !roles.includes(defRole)) return fail(400, "role", "at least one role, default among them");
    if (!allPlants && !plants.length) return fail(400, "plant", "at least one plant");
    if ((allPlants || roles.some((r) => r === "owner" || r === "superadmin")) && !full)
      return fail(403, "noperm", "only a full-access user can grant all plants or the owner role");
    const { data: roleRows } = await caller.from("roles").select("key,role_group").in("key", roles);
    if (!roleRows || roleRows.length !== roles.length) return fail(400, "role", "unknown role");
    if (roleRows.some((r) => r.role_group === "client")) return fail(400, "role", "client portal accounts are not available yet");

    // Account for an employee HR already registered ("menunggu akses").
    let existing: { id: string } | null = null;
    if (b.employee_id) {
      const { data: emp } = await caller.from("employees").select("id").eq("id", String(b.employee_id)).maybeSingle();
      if (!emp) return fail(404, "missing", "employee not found");
      const { data: taken } = await admin.from("profiles").select("id").eq("employee_id", emp.id).maybeSingle();
      if (taken) return fail(400, "has_account", "this employee already has an account");
      existing = emp;
    }
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { display_name: name, must_change_password: true },
    });
    if (cErr || !created?.user) {
      const dup = /already|registered|exists/i.test(cErr?.message ?? "");
      return fail(400, dup ? "dup" : "system", cErr?.message ?? "could not create user");
    }
    const uid = created.user.id;
    const linked = existing ? existing.id : null;
    const empId = linked ?? "EMP-" + uid.replace(/-/g, "").slice(0, 6).toUpperCase();
    const undo = async (msg: string) => { await admin.auth.admin.deleteUser(uid); return fail(400, "system", msg); };

    let r = linked
      ? await caller.from("employees").update({ email }).eq("id", linked)
      : await caller.from("employees").insert({
        id: empId, full_name: name, short_name: name.split(" ")[0], email,
        job_title: b.position ? String(b.position) : null,
        department: b.department ? String(b.department) : null, phone: b.phone ? String(b.phone) : null,
        plant_id: allPlants ? null : plants[0],
      });
    if (r.error) return undo(r.error.message);
    r = await caller.from("profiles").update({
      employee_id: empId, display_name: name,
      all_plants: allPlants, default_plant_id: allPlants ? null : plants[0], can_switch_role: roles.length > 1,
    }).eq("id", uid);
    if (r.error) { if (!linked) await caller.from("employees").delete().eq("id", empId); return undo(r.error.message); }
    r = await caller.from("user_roles").insert(roles.map((k) => ({ user_id: uid, role_key: k, is_default: k === defRole })));
    if (r.error) { if (!linked) await caller.from("employees").delete().eq("id", empId); return undo(r.error.message); }
    if (!allPlants) {
      r = await caller.from("user_plants").insert(plants.map((p) => ({ user_id: uid, plant_id: p })));
      if (r.error) { if (!linked) await caller.from("employees").delete().eq("id", empId); return undo(r.error.message); }
    }
    await caller.rpc("log_event", { p_event: "ACC.CREATED", p_target: email, p_details: { roles, plants: allPlants ? ["*"] : plants } });
    return json(200, { ok: true, user_id: uid, employee_id: empId });
  }

  return fail(400, "bad", "unknown action");
});
