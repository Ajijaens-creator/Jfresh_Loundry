/* ==========================================================================
   JFRESH OS — Design System runtime (Phase 3)
   One set of render functions for every component and pattern, named after
   the Phase 3 naming convention: DS.Button.Primary, DS.Input.Number,
   DS.Card.Task, DS.Status.Waiting, DS.Pattern.WorkQueue …
   Every function returns an HTML string that uses only jfos-ds.css classes
   (which use only jfos-tokens.css values). Labels are [Indonesian, English]
   pairs; Indonesian is the default and English lives in data-en, which the
   shared language switch (assets/js/jfresh.js) swaps. Changing language only
   swaps interface copy: it never changes data, permissions or workflow state.
   ========================================================================== */
(function (root) {
  var DS = { version: 'Phase 3 · NP 1.0', date: '2026-10-06' };

  /* ---------- Helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function P(v) { return Array.isArray(v) ? v : [v, v]; }                 // pair
  function t(v) { var p = P(v); return p[0] === p[1] ? esc(p[0]) : '<span data-en="' + esc(p[1]) + '">' + esc(p[0]) + '</span>'; }
  function ic(name, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
  function attrs(o) { var s = ''; for (var k in o) if (o[k] !== undefined && o[k] !== null && o[k] !== false) s += ' ' + k + (o[k] === true ? '' : '="' + esc(o[k]) + '"'); return s; }
  // Bilingual attribute (placeholder / aria-label): Indonesian value + data-*-en
  function battr(name, v) { if (v == null) return ''; var p = P(v); return ' ' + name + '="' + esc(p[0]) + '"' + (p[0] !== p[1] ? ' data-' + name + '-en="' + esc(p[1]) + '"' : ''); }
  var uid = 0; function id(pfx) { uid += 1; return (pfx || 'ds') + '-' + uid; }
  DS.esc = esc; DS.t = t; DS.ic = ic; DS.P = P; DS.battr = battr;
  function L(a, b) { return [a, b === undefined ? a : b]; }
  DS.L = L;

  /* ---------- Button.* ---------- */
  function button(kind, o) {
    o = o || {};
    var cls = 'ds-btn ds-btn--' + kind + (o.size ? ' ds-btn--' + o.size : '') + (o.block ? ' ds-btn--block' : '') + (o.cta ? ' ds-btn--cta' : '') + (o.loading ? ' is-loading' : '') + (o.state ? ' is-' + o.state : '') + (o.cls ? ' ' + o.cls : '');
    var inner = (o.icon ? ic(o.icon) : '') + (o.label ? '<span>' + t(o.label) + '</span>' : '');
    var a = { 'class': cls, type: o.href ? undefined : (o.type || 'button'), href: o.href, disabled: o.disabled && !o.href, 'aria-disabled': o.disabled && o.href ? 'true' : undefined, 'aria-busy': o.loading ? 'true' : undefined, 'data-act': o.act };
    var tag = o.href ? 'a' : 'button';
    return '<' + tag + attrs(a) + (o.aria ? battr('aria-label', o.aria) : '') + '>' + inner + '</' + tag + '>';
  }
  DS.Button = {
    Primary: function (o) { return button('primary', o); },
    Secondary: function (o) { return button('secondary', o); },
    Action: function (o) { return button('action', o); },
    Danger: function (o) { return button('danger', o); },
    DangerSoft: function (o) { return button('danger-soft', o); },
    Success: function (o) { return button('success', o); },
    Ghost: function (o) { return button('ghost', o); },
    Text: function (o) { return button('text', o); },
    Icon: function (o) {
      o = o || {};
      return '<button type="button" class="ds-iconbtn' + (o.round ? ' ds-iconbtn--round' : '') + '"' + (o.act ? ' data-act="' + esc(o.act) + '"' : '') + '><span class="ds-iconbtn__box">' + ic(o.icon) + '</span><span>' + t(o.label) + '</span></button>';
    }
  };

  /* ---------- Input.* ---------- */
  function helpRow(o) {
    if (!o.help) return '';
    var icn = o.state === 'error' ? ic('alert') : (o.state === 'success' ? ic('checkc') : '');
    return '<p class="ds-help" id="' + o._hid + '">' + icn + '<span>' + t(o.help) + '</span></p>';
  }
  function stateIcon(o) {
    if (o.state === 'error') return '<span class="ds-control__state">' + ic('alert') + '</span>';
    if (o.state === 'success') return '<span class="ds-control__state">' + ic('checkc') + '</span>';
    return '';
  }
  function field(o, control) {
    o._hid = o._hid || id('h');
    return '<div class="ds-field' + (o.state ? ' is-' + o.state : '') + (o.cls ? ' ' + o.cls : '') + '">' +
      (o.label ? '<label class="ds-label" for="' + o._id + '">' + t(o.label) + (o.req ? '<span class="ds-req" aria-hidden="true">*</span>' : '') + (o.tip ? ' ' + DS.Tooltip({ text: o.tip, label: o.label }) : '') + '</label>' : '') +
      control + helpRow(o) + '</div>';
  }
  function inputCtl(o, type, extra) {
    o._id = o._id || id('f'); o._hid = id('h');
    var a = { id: o._id, type: type, value: o.value, inputmode: o.inputmode, disabled: o.state === 'disabled', required: o.req, 'aria-invalid': o.state === 'error' ? 'true' : undefined, 'aria-describedby': o.help ? o._hid : undefined, step: o.step, min: o.min, max: o.max, name: o.name, autocomplete: o.autocomplete, maxlength: o.maxlength, autocapitalize: o.autocapitalize, spellcheck: o.spellcheck };
    return '<div class="ds-control' + (o.lg ? ' ds-control--lg' : '') + '">' + (o.icon ? '<span class="ds-control__icon">' + ic(o.icon) + '</span>' : '') +
      '<input' + attrs(a) + battr('placeholder', o.placeholder) + '>' + (extra || '') + stateIcon(o) + (o.unit ? '<span class="ds-control__unit">' + t(o.unit) + '</span>' : '') + '</div>';
  }
  DS.Input = {
    Text: function (o) { o = o || {}; return field(o, inputCtl(o, 'text')); },
    // Password with show / hide (Phase 4). The toggle keeps the value and the caret; it only swaps type.
    Password: function (o) {
      o = o || {}; o.icon = o.icon === undefined ? 'lock' : o.icon;
      var rv = '<button type="button" class="ds-control__reveal" data-reveal aria-pressed="false"' + battr('aria-label', L('Tampilkan password', 'Show password')) + '>' + ic('eye') + '</button>';
      return field(o, inputCtl(o, 'password', rv));
    },
    Email: function (o) { o = o || {}; o.inputmode = 'email'; return field(o, inputCtl(o, 'email')); },
    Phone: function (o) { o = o || {}; o.inputmode = 'tel'; return field(o, inputCtl(o, 'tel')); },
    Number: function (o) { o = o || {}; o.inputmode = 'decimal'; return field(o, inputCtl(o, 'text')); },
    Search: function (o) { o = o || {}; o.icon = 'search'; return field(o, inputCtl(o, 'search')); },
    Date: function (o) { o = o || {}; return field(o, inputCtl(o, 'date')); },
    Time: function (o) { o = o || {}; return field(o, inputCtl(o, 'time')); },
    Select: function (o) {
      o = o || {}; o._id = id('f'); o._hid = id('h');
      var opts = (o.options || []).map(function (x) { var p = P(x); return '<option' + (p[0] !== p[1] ? ' data-en="' + esc(p[1]) + '"' : '') + '>' + esc(p[0]) + '</option>'; }).join('');
      return field(o, '<div class="ds-control"><select id="' + o._id + '"' + (o.state === 'disabled' ? ' disabled' : '') + (o.help ? ' aria-describedby="' + o._hid + '"' : '') + '>' + opts + '</select><span class="ds-control__end">' + ic('chevd') + '</span></div>');
    },
    Textarea: function (o) {
      o = o || {}; o._id = id('f'); o._hid = id('h');
      return field(o, '<div class="ds-control"><textarea id="' + o._id + '"' + battr('placeholder', o.placeholder) + (o.state === 'disabled' ? ' disabled' : '') + (o.help ? ' aria-describedby="' + o._hid + '"' : '') + '>' + esc(o.value || '') + '</textarea></div>');
    },
    Counter: function (o) {
      o = o || {}; o._id = id('f');
      var lab = o.label ? '<span class="ds-label" id="' + o._id + '-l">' + t(o.label) + '</span>' : '';
      return '<div class="ds-field">' + lab + '<div class="ds-counter" data-counter role="group"' + (o.label ? ' aria-labelledby="' + o._id + '-l"' : '') + '>' +
        '<button type="button" data-step="-1"' + battr('aria-label', L('Kurangi', 'Decrease')) + '>' + ic('minus') + '</button>' +
        '<input type="text" inputmode="numeric" value="' + esc(o.value == null ? 0 : o.value) + '" id="' + o._id + '"' + (o.label ? ' aria-labelledby="' + o._id + '-l"' : '') + '>' +
        '<button type="button" data-step="1"' + battr('aria-label', L('Tambah', 'Increase')) + '>' + ic('plus') + '</button></div></div>';
    },
    Checkbox: function (o) { o = o || {}; return '<label class="ds-check"><input type="checkbox"' + (o.checked ? ' checked' : '') + (o.disabled ? ' disabled' : '') + '><span>' + t(o.label) + '</span></label>'; },
    Radio: function (o) { o = o || {}; return '<label class="ds-radio"><input type="radio" name="' + esc(o.name || 'r') + '"' + (o.checked ? ' checked' : '') + (o.disabled ? ' disabled' : '') + '><span>' + t(o.label) + '</span></label>'; },
    Toggle: function (o) { o = o || {}; return '<label class="ds-toggle"><input type="checkbox" role="switch"' + (o.checked ? ' checked' : '') + (o.disabled ? ' disabled' : '') + '><span>' + t(o.label) + '</span></label>'; },
    Options: function (o) {
      o = o || {}; var n = o.name || id('opt');
      return '<div class="ds-options" role="radiogroup"' + (o.label ? battr('aria-label', o.label) : '') + '>' + (o.options || []).map(function (x, i) {
        return '<label class="ds-option ds-radio"><input type="radio" name="' + n + '"' + (o.checked === i ? ' checked' : '') + '><span>' + t(x) + '</span></label>';
      }).join('') + '</div>';
    }
  };

  /* ---------- Status.* (icon + text + colour, never colour alone) ---------- */
  var STATUS = {
    Waiting: { cls: 'waiting', icon: 'clock', label: L('Menunggu', 'Waiting') },
    Processing: { cls: 'processing', icon: 'loop', label: L('Diproses', 'In Process') },
    Completed: { cls: 'completed', icon: 'checkc', label: L('Selesai', 'Completed') },
    Risk: { cls: 'risk', icon: 'hourglass', label: L('SLA Risk', 'SLA Risk') },
    Late: { cls: 'critical', icon: 'xc', label: L('Terlambat', 'Late') },
    Issue: { cls: 'issue', icon: 'alert', label: L('Ada Masalah', 'Issue') },
    Warning: { cls: 'waiting', icon: 'alert', label: L('Perhatian', 'Warning') },
    Critical: { cls: 'critical', icon: 'xc', label: L('Kritis', 'Critical') },
    Active: { cls: 'completed', icon: 'checkc', label: L('Aktif', 'Active') },
    Inactive: { cls: 'neutral', icon: 'ban', label: L('Nonaktif', 'Inactive') },
    Info: { cls: 'processing', icon: 'status', label: L('Info', 'Info') }
  };
  DS.STATUS = STATUS;
  DS.Status = {};
  Object.keys(STATUS).forEach(function (k) {
    DS.Status[k] = function (o) {
      o = o || {}; var s = STATUS[k];
      return '<span class="ds-chip ds-chip--' + s.cls + (o.lg ? ' ds-chip--lg' : '') + '">' + ic(o.icon || s.icon) + '<span>' + t(o.label || s.label) + '</span>' +
        (o.meta ? ' <span class="ds-chip__meta">' + t(o.meta) + '</span>' : '') + (o.count != null ? '<span class="ds-chip__count">' + esc(o.count) + '</span>' : '') + '</span>';
    };
  });
  DS.Tag = function (v) { return '<span class="ds-tag">' + t(v) + '</span>'; };

  /* ---------- Card.* ---------- */
  DS.Card = {
    // One TaskCard for receiving, QC, packing, delivery… (variants via status/icon/action/content)
    Task: function (o) {
      o = o || {};
      var qty = (o.qty || []).map(function (q) { return '<span><b>' + esc(q[0]) + '</b> ' + t(q[1]) + '</span>'; }).join('');
      return '<article class="ds-taskcard">' +
        '<div class="ds-taskcard__media">' + (o.img ? '<img src="' + esc(o.img) + '" alt="">' : ic(o.icon || 'hotel')) + '</div>' +
        '<div><h3 class="ds-taskcard__title">' + t(o.title) + '</h3><div class="ds-taskcard__id">' + t(o.id || '') + '</div>' + (qty ? '<div class="ds-taskcard__qty">' + qty + '</div>' : '') + (o.note ? '<p class="ds-caption">' + t(o.note) + '</p>' : '') + '</div>' +
        '<div class="ds-taskcard__side">' + (o.time ? '<span class="ds-taskcard__time">' + t(o.time) + '</span>' : '') + (o.status ? DS.Status[o.status](o.statusOpt) : '') + '</div>' +
        (o.cta ? '<div class="ds-taskcard__cta">' + DS.Button[o.ctaKind || 'Action']({ label: o.cta, icon: o.ctaIcon, size: o.ctaSize, block: o.ctaBlock, act: o.act }) + '</div>' : '') +
        '</article>';
    },
    KPI: function (o) {
      o = o || {}; var dir = o.dir || 'up';
      return '<div class="ds-kpi' + (o.tint ? ' ds-kpi--tint-' + o.tint : '') + '"><span class="ds-kpi__label">' + t(o.label) + '</span><span class="ds-kpi__value">' + t(o.value) + '</span>' +
        (o.trend ? '<span class="ds-kpi__trend ds-kpi__trend--' + dir + '">' + ic(dir === 'down' ? 'arrowdn' : (dir === 'flat' ? 'minus' : 'arrowup')) + t(o.trend) + '</span>' : '') +
        (o.ctx ? '<span class="ds-kpi__ctx">' + t(o.ctx) + '</span>' : '') + '</div>';
    },
    Alert: function (o) {
      o = o || {}; var lv = o.level || 'critical';
      var tag = { critical: L('Kritis', 'Critical'), warning: L('Peringatan', 'Warning'), info: L('Info', 'Info') }[lv];
      return '<div class="ds-alertcard' + (lv === 'critical' ? '' : ' ds-alertcard--' + lv) + '" role="' + (lv === 'critical' ? 'alert' : 'status') + '">' + ic(lv === 'info' ? 'status' : (lv === 'warning' ? 'hourglass' : 'alert')) +
        '<div><div class="ds-alertcard__tag">' + t(o.tag || tag) + '</div><div class="ds-alertcard__title">' + t(o.title) + '</div>' + (o.text ? '<p class="ds-caption">' + t(o.text) + '</p>' : '') + '</div>' +
        (o.act ? '<div class="ds-alertcard__act">' + DS.Button.Text({ label: o.act, icon: 'arrow', size: 'sm' }) + '</div>' : '') + '</div>';
    },
    Action: function (o) {
      o = o || {};
      return '<a class="ds-actioncard' + (o.cta ? ' ds-actioncard--cta' : '') + '" href="' + esc(o.href || '#') + '"' + (o.act ? ' data-act="' + esc(o.act) + '"' : '') + '><span class="ds-actioncard__ic">' + ic(o.icon || 'zap') + '</span><span class="ds-actioncard__tx"><b>' + t(o.title) + '</b>' + (o.sub ? '<span>' + t(o.sub) + '</span>' : '') + '</span>' + ic('chevr') + '</a>';
    },
    Summary: function (o) {
      o = o || {};
      return '<div class="ds-summary' + (o.tone === 'blue' ? ' ds-summary--blue' : '') + '"><span class="ds-summary__ic">' + ic(o.icon || 'package') + '</span><span class="ds-kpi__label">' + t(o.label) + '</span><span class="ds-kpi__value">' + t(o.value) + '</span>' +
        (o.trend ? '<span class="ds-kpi__trend ds-kpi__trend--' + (o.dir || 'up') + '">' + ic(o.dir === 'down' ? 'arrowdn' : 'arrowup') + t(o.trend) + '</span>' : '') + '</div>';
    },
    Client: function (o) {
      o = o || {};
      return '<div class="ds-clientcard"><div class="ds-row ds-row--between"><h3 class="ds-h3">' + t(o.name) + '</h3>' + (o.more ? '<button class="ds-bell" type="button"' + battr('aria-label', L('Opsi lainnya', 'More options')) + '>' + ic('more') + '</button>' : '') + '</div>' +
        (o.id ? '<div class="ds-caption ds-tabular">' + t(o.id) + '</div>' : '') + (o.meta ? '<div class="ds-clientcard__meta">' + ic(o.metaIcon || 'building') + t(o.meta) + '</div>' : '') +
        '<div>' + DS.Status[o.status || 'Active']() + '</div>' + (o.cta ? DS.Button.Action({ label: o.cta, block: true }) : '') + '</div>';
    }
  };

  /* ---------- Nav.* ---------- */
  DS.Nav = {
    Sidebar: function (o) {
      o = o || {};
      return '<nav class="ds-sidebar' + (o.rail ? ' ds-sidebar--rail' : '') + '"' + battr('aria-label', L('Menu utama', 'Main menu')) + '>' +
        '<div class="ds-sidebar__logo"><img src="' + esc((o.root || '') + 'assets/brand/jfresh-logo.png') + '" alt="J\'Fresh Laundry" width="605" height="373"></div>' +
        (o.items || []).map(function (x, i) { return '<a href="#"' + (i === (o.current || 0) ? ' aria-current="page"' : '') + (o.rail ? battr('aria-label', x[1]) : '') + '>' + ic(x[0]) + '<span>' + t(x[1]) + '</span></a>'; }).join('') + '</nav>';
    },
    Topbar: function (o) {
      o = o || {};
      return '<header class="ds-topbar">' + (o.menu ? '<button class="ds-bell" type="button"' + battr('aria-label', L('Buka menu', 'Open menu')) + '>' + ic('menu') + '</button>' : '') +
        '<div class="ds-topbar__search">' + DS.Input.Search({ placeholder: L('Cari…', 'Search…') }) + '</div><span class="ds-topbar__sp"></span>' +
        '<div class="ds-langswitch" role="group" aria-label="Bahasa / Language"><button type="button" aria-pressed="true">ID</button><button type="button" aria-pressed="false">EN</button></div>' +
        '<button class="ds-bell" type="button"' + battr('aria-label', L('Notifikasi, 3 baru', 'Notifications, 3 new')) + '>' + ic('bell') + '<span class="ds-badge">3</span></button>' +
        '<div class="ds-topbar__me"><span class="ds-avatar">' + esc((o.name || 'AJ').slice(0, 2).toUpperCase()) + '</span><span class="ds-hide-m"><b>' + esc(o.name || 'Aji Jaens') + '</b><small>' + t(o.role || 'CEO') + '</small></span></div></header>';
    },
    BottomNav: function (o) {
      o = o || {}; var items = o.items || [['home', L('Beranda', 'Home')], ['clipboard', L('Tugas', 'Tasks')], ['scan', L('Scan', 'Scan'), 1], ['bell', L('Notifikasi', 'Alerts')], ['menu', L('Lainnya', 'More')]];
      return '<nav class="ds-bottomnav"' + battr('aria-label', L('Navigasi bawah', 'Bottom navigation')) + '>' + items.slice(0, 5).map(function (x, i) {
        return x[2] ? '<a href="#" class="ds-bottomnav__main"><span class="ds-bottomnav__fab">' + ic(x[0]) + '</span>' + t(x[1]) + '</a>' :
          '<a href="#"' + (i === (o.current || 0) ? ' aria-current="page"' : '') + '>' + ic(x[0]) + t(x[1]) + '</a>';
      }).join('') + '</nav>';
    },
    Tabs: function (o) {
      o = o || {}; var n = id('tabs');
      return '<div class="ds-tabs" role="tablist" data-tabs>' + (o.items || []).map(function (x, i) {
        return '<button type="button" role="tab" id="' + n + '-' + i + '" aria-selected="' + (i === (o.current || 0)) + '" tabindex="' + (i === (o.current || 0) ? 0 : -1) + '">' + t(Array.isArray(x[0]) || typeof x === 'string' ? x : x) + '</button>';
      }).join('') + '</div>';
    },
    Segment: function (o) {
      o = o || {};
      return '<div class="ds-segment" role="group" data-segment>' + (o.items || []).map(function (x, i) { return '<button type="button" aria-pressed="' + (i === (o.current || 0)) + '">' + t(x) + '</button>'; }).join('') + '</div>';
    },
    Breadcrumb: function (o) {
      o = o || {}; var it = o.items || [];
      return '<nav class="ds-breadcrumb"' + battr('aria-label', L('Lokasi halaman', 'Breadcrumb')) + '><a href="#"' + battr('aria-label', L('Beranda', 'Home')) + '>' + ic('home') + '</a>' + it.map(function (x, i) {
        return ic('chevr') + (i === it.length - 1 ? '<span aria-current="page">' + t(x) + '</span>' : '<a href="#">' + t(x) + '</a>');
      }).join('') + '</nav>';
    }
  };

  /* ---------- Stepper.* ---------- */
  DS.STAGES = [L('Terima', 'Receive'), L('Sortir', 'Sort'), L('Cuci', 'Wash'), L('Kering', 'Dry'), L('Finishing', 'Finishing'), L('QC', 'QC'), L('Packing', 'Packing'), L('Kirim', 'Deliver')];
  DS.Stepper = {
    // o.current: index of current step; o.problem: index with problem; o.meta: {i: [pair]}
    Process: function (o) {
      o = o || {}; var steps = o.steps || DS.STAGES, cur = o.current == null ? 0 : o.current;
      var mode = o.vertical ? ' ds-steps--vertical' : (o.auto === false ? '' : ' ds-steps--auto');
      return '<ol class="ds-steps' + mode + '"' + battr('aria-label', o.label || L('Tahapan proses', 'Process stages')) + '>' + steps.map(function (s, i) {
        var st = i === o.problem ? 'problem' : (i < cur ? 'done' : (i === cur ? 'current' : 'upcoming'));
        var dot = st === 'done' ? ic('check') : (st === 'problem' ? ic('alert') : (i + 1));
        var sr = { done: L('selesai', 'completed'), current: L('sedang berjalan', 'current'), problem: L('ada masalah', 'problem'), upcoming: L('berikutnya', 'upcoming') }[st];
        var meta = o.meta && o.meta[i] ? '<span class="ds-step__meta">' + t(o.meta[i]) + '</span>' : '';
        var chip = o.vertical && o.chips ? (st === 'done' ? DS.Status.Completed() : (st === 'current' ? DS.Status.Processing({ label: L('Sedang Proses', 'In Progress') }) : (st === 'problem' ? DS.Status.Issue() : DS.Status.Waiting()))) : '';
        return '<li class="ds-step is-' + st + '"' + (st === 'current' ? ' aria-current="step"' : '') + '><span class="ds-step__dot">' + dot + '</span>' +
          (o.vertical ? '<span class="ds-step__body"><span class="ds-step__label">' + t(s) + '</span>' + meta + '</span>' + chip : '<span class="ds-step__label">' + t(s) + '</span>' + meta) +
          '<span class="ds-sr"> — ' + t(sr) + '</span></li>';
      }).join('') + '</ol>';
    },
    Progress: function (o) {
      o = o || {};
      return '<div class="ds-stack ds-gap-2"><div class="ds-row ds-row--between"><span class="ds-label">' + t(o.label || L('Mengupload data…', 'Uploading data…')) + '</span><b class="ds-tabular">' + esc(o.value) + '%</b></div>' +
        '<div class="ds-progress" role="progressbar" aria-valuenow="' + esc(o.value) + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + esc(o.value) + '%"></span></div></div>';
    }
  };

  /* ---------- Data.* ---------- */
  DS.Data = {
    // cols: [{k, l:[pair], num, chip}] rows: [{k: value}] — value may be pair or status key
    Table: function (o) {
      o = o || {};
      var head = '<thead><tr>' + o.cols.map(function (c) { return '<th scope="col"' + (c.num ? ' class="ds-num-cell"' : '') + (c.sort ? ' aria-sort="' + (c.sort === 'asc' ? 'ascending' : 'none') + '"' : '') + '>' + (c.sort ? '<button type="button">' + t(c.l) + ic('sort') + '</button>' : t(c.l)) + '</th>'; }).join('') + '</tr></thead>';
      var body = '<tbody>' + o.rows.map(function (r) {
        return '<tr>' + o.cols.map(function (c) {
          var v = r[c.k], html = c.chip ? DS.Status[v]() : (c.act ? DS.Button.Text({ label: L('Lihat', 'View'), size: 'sm' }) : (c.strong ? '<b>' + t(v) + '</b>' : t(v)));
          return '<td' + (c.num ? ' class="ds-num-cell"' : '') + ' data-label="' + esc(P(c.l)[0]) + '"' + (P(c.l)[0] !== P(c.l)[1] ? ' data-label-en="' + esc(P(c.l)[1]) + '"' : '') + '>' + html + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody>';
      return '<div class="ds-tablewrap"><table class="ds-table' + (o.stack === false ? '' : ' ds-table--stack') + '">' + (o.caption ? '<caption class="ds-sr">' + t(o.caption) + '</caption>' : '') + head + body + '</table></div>';
    },
    List: function (o) {
      o = o || {};
      return '<div class="ds-list">' + (o.items || []).map(function (x) {
        return '<a class="ds-list__item" href="#">' + (x.icon ? '<span class="ds-actioncard__ic">' + ic(x.icon) + '</span>' : '') + '<span class="ds-list__tx"><b>' + t(x.title) + '</b>' + (x.sub ? '<span>' + t(x.sub) + '</span>' : '') + '</span>' + (x.status ? DS.Status[x.status]() : '') + (x.end ? '<span class="ds-list__end">' + t(x.end) + '</span>' : '') + ic('chevr') + '</a>';
      }).join('') + '</div>';
    },
    Pagination: function (o) {
      o = o || {}; var n = o.pages || 5, cur = o.current || 1;
      var h = '<nav class="ds-pagination"' + battr('aria-label', L('Halaman', 'Pages')) + '><button type="button"' + battr('aria-label', L('Sebelumnya', 'Previous')) + '>' + ic('arrowl') + '</button>';
      for (var i = 1; i <= n; i++) h += '<button type="button"' + (i === cur ? ' aria-current="page"' : '') + '>' + i + '</button>';
      return h + '<button type="button"' + battr('aria-label', L('Berikutnya', 'Next')) + '>' + ic('arrow') + '</button><span class="ds-pagination__info">' + t(o.info || L('10 / halaman', '10 / page')) + '</span></nav>';
    },
    FilterBar: function (o) {
      o = o || {};
      return '<div class="ds-filterbar">' + DS.Input.Search({ label: L('Cari', 'Search'), placeholder: o.placeholder || L('Cari order, klien…', 'Search order, client…') }) +
        (o.filters || []).map(function (f) { return DS.Input.Select({ label: f[0], options: f[1] }); }).join('') +
        '<div class="ds-btnbar">' + DS.Button.Ghost({ label: L('Filter Lainnya', 'More Filters'), icon: 'filter' }) + (o.export === false ? '' : DS.Button.Ghost({ label: L('Ekspor', 'Export'), icon: 'download' })) + '</div></div>';
    }
  };

  /* ---------- Feedback.* ---------- */
  var TOAST_IC = { success: 'check', info: 'status', warning: 'alert', error: 'x' };
  DS.Feedback = {
    Toast: function (o) {
      o = o || {}; var ty = o.type || 'info';
      return '<div class="ds-toast ds-toast--' + ty + '" role="' + (ty === 'error' ? 'alert' : 'status') + '"><span class="ds-toast__ic">' + ic(TOAST_IC[ty]) + '</span><div>' +
        (o.title ? '<div class="ds-toast__title">' + t(o.title) + '</div>' : '') + '<div class="ds-toast__text">' + t(o.text) + '</div></div>' +
        '<button type="button" class="ds-toast__x" data-dismiss' + battr('aria-label', L('Tutup', 'Close')) + '>' + ic('x') + '</button></div>';
    },
    Inline: function (o) {
      o = o || {}; var ty = o.type || 'info';
      return '<div class="ds-inline ds-inline--' + ty + '" role="' + (ty === 'error' ? 'alert' : 'status') + '">' + ic({ success: 'checkc', info: 'status', warning: 'alert', error: 'xc' }[ty]) + '<div>' + (o.title ? '<b>' + t(o.title) + '</b> ' : '') + t(o.text) + '</div></div>';
    },
    Dialog: function (o) {
      o = o || {}; var n = id('dlg');
      return '<div class="ds-dialog' + (o.inline ? ' ds-dialog--inline' : '') + '" role="' + (o.inline ? 'group' : 'alertdialog') + '" aria-labelledby="' + n + '-t" aria-describedby="' + n + '-d">' +
        '<span class="ds-dialog__ic' + (o.danger ? ' ds-dialog__ic--danger' : '') + '">' + ic(o.icon || 'alert') + '</span><h2 class="ds-dialog__title" id="' + n + '-t">' + t(o.title) + '</h2><p class="ds-dialog__text" id="' + n + '-d">' + t(o.text) + '</p>' +
        '<div class="ds-dialog__actions">' + DS.Button.Ghost({ label: o.cancel || L('Batal', 'Cancel'), act: 'close' }) + (o.danger ? DS.Button.Danger({ label: o.ok, act: 'confirm' }) : DS.Button.Action({ label: o.ok, act: 'confirm' })) + '</div></div>';
    },
    Drawer: function (o) {
      o = o || {};
      return '<aside class="ds-drawer" role="dialog" aria-modal="true" hidden data-drawer="' + esc(o.key || 'drawer') + '"' + battr('aria-label', o.title) + '><div class="ds-drawer__h"><h2>' + t(o.title) + '</h2><button type="button" class="ds-toast__x" data-close' + battr('aria-label', L('Tutup', 'Close')) + '>' + ic('x') + '</button></div>' +
        '<div class="ds-drawer__b">' + (o.body || '') + '</div><div class="ds-drawer__f">' + DS.Button.Ghost({ label: L('Reset', 'Reset'), act: 'close' }) + DS.Button.Action({ label: L('Terapkan', 'Apply'), act: 'close' }) + '</div></aside>';
    }
  };
  DS.Tooltip = function (o) {
    o = o || {}; var n = id('tip');
    return '<span class="ds-tip' + (o.static ? ' ds-tip--static' : '') + '" data-tip><button type="button" class="ds-tip__btn" aria-describedby="' + n + '" aria-expanded="false"' + battr('aria-label', L('Bantuan', 'Help')) + '>' + ic('help') + '</button><span class="ds-tip__bubble" role="tooltip" id="' + n + '"' + (o.static ? '' : ' hidden') + '>' + t(o.text) + '</span></span>';
  };
  DS.Notification = function (o) {
    o = o || {};
    return '<a href="#" class="ds-notif' + (o.unread ? ' is-unread' : '') + '"><span class="ds-notif__ic' + (o.tone ? ' is-' + o.tone : '') + '">' + ic(o.icon || 'bell') + '</span><span class="ds-notif__title">' + t(o.title) + '</span><span class="ds-notif__ctx">' + t(o.ctx) + '</span><span class="ds-notif__time">' + t(o.time) + (o.unread ? '<span class="ds-sr">' + t(L('belum dibaca', 'unread')) + '</span>' : '') + '</span></a>';
  };

  /* ---------- Media.* ---------- */
  DS.Media = {
    Upload: function (o) {
      o = o || {};
      return '<label class="ds-upload" data-upload>' + ic('upload') + '<b>' + t(o.title || L('Tarik & lepas file di sini', 'Drag & drop files here')) + '</b><span>' + t(L('atau', 'or')) + '</span><span class="ds-btn ds-btn--secondary ds-btn--sm">' + t(L('Pilih File', 'Choose File')) + '</span>' +
        '<input type="file" multiple accept="image/*,application/pdf"><span class="ds-caption">' + t(o.hint || L('Format: JPG, PNG, PDF (maks. 10 MB)', 'Format: JPG, PNG, PDF (max 10 MB)')) + '</span></label>';
    },
    Photos: function (o) {
      o = o || {};
      return '<div class="ds-photos">' + (o.items || []).map(function () { return '<div class="ds-photo">' + ic('shirt', 'i-lg') + '<button type="button" class="ds-photo__x" data-remove' + battr('aria-label', L('Hapus foto', 'Remove photo')) + '>' + ic('x') + '</button></div>'; }).join('') +
        '<button type="button" class="ds-photo ds-photo--add' + (o.required ? ' ds-photo--req' : '') + '" data-act="camera">' + ic('camera') + t(o.label || L('Ambil Foto', 'Take Photo')) + '</button></div>';
    },
    Doc: function (o) {
      o = o || {};
      return '<div class="ds-doc"><span class="ds-doc__ic">' + esc(o.ext || 'PDF') + '</span><span class="ds-doc__tx"><b>' + t(o.name) + '</b><span>' + t(o.size || '2.4 MB') + '</span></span>' +
        '<button class="ds-bell" type="button"' + battr('aria-label', L('Unduh', 'Download')) + '>' + ic('download') + '</button><button class="ds-bell" type="button"' + battr('aria-label', L('Hapus file', 'Remove file')) + '>' + ic('trash') + '</button></div>';
    }
  };

  /* ---------- State.* (NP-07) ---------- */
  function stateBox(o, icon, tone) {
    return '<section class="ds-state' + (o.plain ? ' ds-state--plain' : '') + '" role="' + (o.role || 'status') + '"><span class="ds-state__ic' + (tone ? ' ds-state__ic--' + tone : '') + '">' + ic(o.icon || icon) + '</span>' +
      '<h3 class="ds-state__title">' + t(o.title) + '</h3>' + (o.text ? '<p class="ds-state__text">' + t(o.text) + '</p>' : '') + (o.meta ? '<p class="ds-state__meta">' + t(o.meta) + '</p>' : '') +
      (o.actions ? '<div class="ds-state__actions">' + o.actions + '</div>' : '') + '</section>';
  }
  DS.State = {
    Loading: function (o) {
      o = o || {};
      return '<section class="ds-state" role="status" aria-live="polite" aria-busy="true"><span class="ds-spinner" aria-hidden="true"></span><h3 class="ds-state__title">' + t(o.title || L('Memproses…', 'Processing…')) + '</h3><p class="ds-state__text">' + t(o.text || L('Mohon tunggu sebentar.', 'Please wait a moment.')) + '</p>' +
        (o.progress != null ? '<div style="width:100%;max-width:320px">' + DS.Stepper.Progress({ value: o.progress }) + '</div>' : '') + '</section>';
    },
    Skeleton: function (o) {
      o = o || {}; var n = o.rows || 3, h = '';
      for (var i = 0; i < n; i++) h += '<div class="ds-card ds-card--flat ds-row ds-gap-3"><span class="ds-skeleton" style="width:56px;height:56px"></span><span class="ds-stack ds-gap-2" style="flex:1"><span class="ds-skeleton" style="height:18px;width:60%"></span><span class="ds-skeleton" style="height:14px;width:40%"></span></span></div>';
      return '<div class="ds-stack ds-gap-3" aria-busy="true"' + battr('aria-label', L('Memuat data', 'Loading data')) + '>' + h + '</div>';
    },
    Empty: function (o) { o = o || {}; return stateBox({ title: o.title || L('Belum ada data cucian.', 'No laundry data yet.'), text: o.text || L('Data akan muncul di sini setelah diterima.', 'Data will appear here once received.'), actions: o.actions, icon: o.icon, plain: o.plain }, 'basket', 'muted'); },
    Success: function (o) { o = o || {}; return stateBox({ title: o.title || L('Cucian berhasil diterima.', 'Laundry received.'), text: o.text, meta: o.meta, actions: o.actions, plain: o.plain }, 'check', 'success'); },
    Warning: function (o) { o = o || {}; return stateBox({ title: o.title || L('SLA hampir habis.', 'SLA almost due.'), text: o.text || L('Tersisa 45 menit.', '45 minutes left.'), actions: o.actions, plain: o.plain }, 'hourglass', 'warning'); },
    Error: function (o) { o = o || {}; return stateBox({ title: o.title || L('Tidak ada koneksi internet.', 'No internet connection.'), text: o.text || L('Periksa koneksi Anda dan coba lagi.', 'Check your connection and try again.'), actions: o.actions, icon: o.icon, plain: o.plain, role: 'alert' }, 'wifioff', 'error'); },
    NoPermission: function (o) { o = o || {}; return stateBox({ title: o.title || L('Anda tidak memiliki akses untuk tindakan ini.', 'You do not have access to this action.'), text: o.text || L('Hubungi supervisor jika Anda memerlukan akses.', 'Ask your supervisor if you need access.'), actions: o.actions, plain: o.plain }, 'lock', 'muted'); },
    Offline: function (o) {
      o = o || {};
      return stateBox({ title: L('Internet terputus.', 'Internet disconnected.'), text: o.queue ? L('Data akan dikirim setelah koneksi kembali.', 'Data will be sent when the connection is back.') : L('Sambungkan internet untuk melanjutkan.', 'Connect to the internet to continue.'), actions: o.actions, plain: o.plain }, 'wifioff', 'warning');
    },
    OfflineBar: function (o) { o = o || {}; return '<div class="ds-offline-bar" role="status">' + ic('wifioff') + t(o.queue ? L('Offline · 2 data menunggu dikirim', 'Offline · 2 items waiting to send') : L('Offline · sambungkan internet untuk menyimpan', 'Offline · connect to save')) + '</div>'; }
  };

  /* ---------- Pattern.* (NP-05 operational · NP-06 management) ---------- */
  var DEMO = DS.DEMO = {
    loads: [
      { c: 'Hotel ABC', id: '#LND-001', kg: '82.4', bag: 8, time: '10:24' },
      { c: 'Villa Sunset', id: '#LND-002', kg: '46.2', bag: 5, time: '09:40' },
      { c: 'Hotel Indigo', id: '#LND-003', kg: '91.2', bag: 10, time: '08:15' },
      { c: 'The Kayon', id: '#LND-004', kg: '38.6', bag: 4, time: '07:50' }
    ]
  };
  function qty(l) { return [[l.kg, L('kg', 'kg')], [String(l.bag), L('Bag', 'Bags')]]; }
  function screenHead(title, sub, back) {
    return '<div class="ds-row ds-gap-3" style="flex-wrap:nowrap">' + (back ? '<button class="ds-bell" type="button"' + battr('aria-label', L('Kembali', 'Back')) + '>' + ic('arrowl') + '</button>' : '') +
      '<div style="flex:1;min-width:0"><h2 class="ds-h2">' + t(title) + '</h2>' + (sub ? '<p class="ds-caption ds-tabular">' + t(sub) + '</p>' : '') + '</div></div>';
  }
  DS.screenHead = screenHead;
  DS.Pattern = {
    WorkQueue: function (o) {
      o = o || {};
      return '<div class="ds-stack ds-ops">' + screenHead(L('Cucian Menunggu', 'Laundry Waiting')) +
        DS.Input.Search({ placeholder: L('Cari hotel, order, atau tag…', 'Search hotel, order or tag…') }) +
        DS.Nav.Segment({ items: [L('Semua (12)', 'All (12)'), L('Pickup (4)', 'Pickup (4)'), L('On Site (8)', 'On Site (8)')] }) +
        '<div class="ds-stack ds-gap-3">' + DEMO.loads.slice(0, o.n || 4).map(function (l) {
          return DS.Card.Task({ title: l.c, id: l.id, qty: qty(l), time: l.time, status: 'Waiting', cta: L('Terima', 'Receive'), ctaKind: 'Action', act: 'receive' });
        }).join('') + '</div></div>';
    },
    TaskDetail: function () {
      var l = DEMO.loads[0];
      return '<div class="ds-stack ds-ops">' + screenHead(L('Detail Cucian', 'Laundry Detail'), null, true) +
        '<div class="ds-row ds-gap-3" style="align-items:flex-start;flex-wrap:nowrap"><div class="ds-taskcard__media">' + ic('hotel') + '</div><div style="flex:1"><h3 class="ds-h3">' + l.c + '</h3><p class="ds-caption ds-tabular">' + l.id + '</p><div style="margin-top:8px">' + DS.Status.Waiting() + '</div></div><span class="ds-taskcard__time">10:24<br>25 Sep 2024</span></div>' +
        DS.Nav.Tabs({ items: [L('Informasi', 'Information'), L('Item (8)', 'Items (8)'), L('Catatan', 'Notes')] }) +
        '<dl class="ds-dl">' +
        [[L('Jenis Cucian', 'Laundry Type'), L('Bed Linen, Bath Towel', 'Bed Linen, Bath Towel')], [L('Total Berat', 'Total Weight'), '82.4 kg'], [L('Jumlah Bag', 'Bag Count'), '8 Bag'], [L('SLA', 'SLA'), L('Hari ini, 18:00', 'Today, 18:00')], [L('Klien', 'Client'), 'Hotel ABC'], [L('Lokasi Pickup', 'Pickup Location'), 'Main Lobby'], [L('Catatan', 'Note'), L('Harap dipisah linen putih dan warna. Terima kasih.', 'Please separate white and coloured linen. Thank you.')]]
          .map(function (r, i) { return '<div><dt>' + t(r[0]) + '</dt><dd>' + t(r[1]) + (i === 3 ? ' ' + DS.Status.Completed({ icon: 'clock', label: L('7 jam 36 menit tersisa', '7 h 36 min left') }) : '') + '</dd></div>'; }).join('') + '</dl>' +
        '<div class="ds-actions">' + DS.Button.Primary({ label: L('Terima Cucian', 'Receive Laundry'), icon: 'package', size: 'lg', block: true, act: 'receive' }) + '</div></div>';
    },
    QuickAction: function () {
      return '<div class="ds-stack ds-ops">' + screenHead(L('Terima Cucian', 'Receive Laundry'), null, true) +
        DS.Stepper.Process({ steps: [L('Terima', 'Receive'), L('Sortir', 'Sort'), L('Cuci', 'Wash'), L('Lainnya', 'More')], current: 0, auto: false }) +
        DS.Card.Task({ title: 'Hotel ABC', id: '#LND-001', status: 'Waiting' }) +
        '<div class="ds-grid" style="--jf-grid-cols:2;gap:12px"><div style="grid-column:span 1">' + DS.Input.Number({ label: L('Berat Total', 'Total Weight'), value: '82.4', unit: 'kg', lg: true, req: true, tip: L('Berat cucian adalah total berat semua item dalam satu order.', 'Laundry weight is the total weight of every item in one order.') }) + '</div>' +
        '<div style="grid-column:span 1">' + DS.Input.Counter({ label: L('Jumlah Bag', 'Bag Count'), value: 8 }) + '</div></div>' +
        '<div class="ds-field"><span class="ds-label">' + t(L('Foto Cucian (opsional)', 'Laundry Photo (optional)')) + '</span>' + DS.Media.Photos({ items: [1, 2] }) + '</div>' +
        DS.Input.Textarea({ label: L('Catatan (opsional)', 'Note (optional)'), placeholder: L('Tulis catatan…', 'Write a note…') }) +
        '<div class="ds-actions">' + DS.Button.Primary({ label: L('Simpan & Lanjut', 'Save & Continue'), icon: 'arrow', size: 'lg', block: true, act: 'save' }) + '</div></div>';
    },
    ProcessStepper: function () {
      var meta = { 0: L('25 Sep 10:24', '25 Sep 10:24'), 1: L('Made Sari · mulai 11:10', 'Made Sari · started 11:10') };
      return '<div class="ds-stack ds-ops">' + screenHead(L('Proses Cucian', 'Laundry Process'), '#LND-001 · Hotel ABC', true) +
        DS.Stepper.Process({ steps: [L('Terima', 'Receive'), L('Sortir', 'Sort'), L('Cuci', 'Wash'), L('Kering', 'Dry'), L('Finishing', 'Finishing'), L('QC', 'QC'), L('Packing', 'Packing'), L('Siap Dikirim', 'Ready to Ship')], current: 1, vertical: true, chips: true, meta: meta }) +
        '<div class="ds-actions">' + DS.Button.Primary({ label: L('Mulai Sortir', 'Start Sorting'), icon: 'arrow', size: 'lg', block: true }) + '</div></div>';
    },
    QCDecision: function () {
      var checks = [L('Kebersihan', 'Cleanliness'), L('Tidak Ada Noda', 'No Stains'), L('Tidak Ada Kerusakan', 'No Damage'), L('Aroma Bersih', 'Clean Scent'), L('Hasil Sesuai', 'Result Matches')];
      return '<div class="ds-stack ds-ops">' + screenHead(L('Quality Check', 'Quality Check'), '#LND-001 · Hotel ABC', true) +
        '<div class="ds-list">' + checks.map(function (c) { return '<label class="ds-list__item ds-check" style="cursor:pointer"><input type="checkbox" checked><span class="ds-list__tx"><b>' + t(c) + '</b></span><span class="ds-chip ds-chip--completed">' + ic('check') + 'OK</span></label>'; }).join('') + '</div>' +
        DS.Input.Textarea({ label: L('Catatan (opsional)', 'Note (optional)'), placeholder: L('Tulis catatan…', 'Write a note…') }) +
        '<div class="ds-actions">' + DS.Button.Success({ label: L('LULUS', 'PASS'), icon: 'checkc', size: 'lg', block: true, act: 'pass' }) + DS.Button.DangerSoft({ label: L('ADA MASALAH', 'HAS ISSUE'), icon: 'alert', size: 'lg', block: true, act: 'issue' }) + '</div></div>';
    },
    IssueFlow: function () {
      return '<div class="ds-stack ds-ops">' + screenHead(L('Ada Masalah', 'Report Issue'), '#LND-001 · Hotel ABC', true) +
        '<div class="ds-field"><span class="ds-label">' + t(L('Pilih Alasan Masalah', 'Choose Issue Reason')) + '<span class="ds-req">*</span></span>' +
        DS.Input.Options({ label: L('Alasan masalah', 'Issue reason'), checked: 0, options: [L('Noda', 'Stain'), L('Rusak', 'Damaged'), L('Bau', 'Odour'), L('Salah Proses', 'Wrong Process'), L('Selisih Jumlah', 'Count Mismatch'), L('Kualitas Tidak Sesuai', 'Quality Not Met'), L('Lainnya', 'Other')] }) + '</div>' +
        '<div class="ds-field"><span class="ds-label">' + t(L('Foto (wajib)', 'Photo (required)')) + '<span class="ds-req">*</span></span>' + DS.Media.Photos({ items: [1], required: true }) + '</div>' +
        DS.Input.Textarea({ label: L('Catatan', 'Note'), placeholder: L('Jelaskan masalah…', 'Describe the issue…') }) +
        '<div class="ds-actions">' + DS.Button.Danger({ label: L('Simpan Masalah', 'Save Issue'), icon: 'alert', size: 'lg', block: true }) + '</div></div>';
    },
    /* Management */
    ExecutiveKPI: function () {
      return '<div class="ds-kpigrid">' +
        DS.Card.KPI({ label: L('Revenue', 'Revenue'), value: 'Rp125.4 jt', trend: '12%', tint: 'orange' }) +
        DS.Card.KPI({ label: L('Volume', 'Volume'), value: '12.5 ton', trend: '8%', tint: 'blue' }) +
        DS.Card.KPI({ label: L('SLA On-Time', 'SLA On-Time'), value: '96%', trend: '2%', tint: 'green' }) +
        DS.Card.KPI({ label: L('Rewash Rate', 'Rewash Rate'), value: '1.8%', trend: '0.5%', dir: 'down', tint: 'red', ctx: L('turun = lebih baik', 'down = better') }) +
        DS.Card.KPI({ label: L('Piutang (AR)', 'Outstanding AR'), value: 'Rp38.2 jt', trend: '4%', dir: 'flat' }) +
        DS.Card.KPI({ label: L('Profit Margin', 'Profit Margin'), value: '37.7%', trend: '3%' }) + '</div>';
    },
    Insight: function (o) {
      o = o || {};
      var data = o.data || [9.4, 10.2, 11.8, 10.9, 12.1, 12.8, 12.5], days = [L('Sen', 'Mon'), L('Sel', 'Tue'), L('Rab', 'Wed'), L('Kam', 'Thu'), L('Jum', 'Fri'), L('Sab', 'Sat'), L('Min', 'Sun')];
      var max = 15, W = 420, H = 180, pad = 28, bw = (W - pad) / data.length;
      var bars = data.map(function (v, i) { var h = (v / max) * (H - 40); return '<rect x="' + (pad + i * bw + bw * 0.22) + '" y="' + (H - 20 - h) + '" width="' + (bw * 0.56) + '" height="' + h + '" rx="4" fill="var(--jf-chart-1)"' + (i === data.length - 1 ? ' fill-opacity=".55"' : '') + '><title>' + P(days[i])[0] + ': ' + v + ' ton</title></rect>' +
        '<text x="' + (pad + i * bw + bw / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="11" fill="var(--jf-chart-axis)">' + P(days[i])[0] + '</text>'; }).join('');
      var grid = [0, 5, 10, 15].map(function (g) { var y = H - 20 - (g / max) * (H - 40); return '<line x1="' + pad + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="var(--jf-chart-grid)"/><text x="' + (pad - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="var(--jf-chart-axis)">' + g + '</text>'; }).join('');
      return '<div class="ds-card ds-stack ds-gap-3"><div class="ds-row ds-row--between"><div><h3 class="ds-h3">' + t(L('Volume Cucian 7 Hari', 'Laundry Volume 7 Days')) + '</h3><p class="ds-caption">' + t(L('19–25 Sep 2024 · ton', '19–25 Sep 2024 · tons')) + '</p></div>' +
        '<div style="text-align:right"><div class="ds-kpi__value" style="font-size:var(--jf-fs-h2)">79.7 ton</div><span class="ds-kpi__trend ds-kpi__trend--up">' + ic('arrowup') + '8%</span></div></div>' +
        '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img"' + battr('aria-label', L('Grafik batang volume cucian 7 hari, naik 8%', 'Bar chart of 7-day laundry volume, up 8%')) + ' style="width:100%;height:auto">' + grid + bars + '</svg>' +
        DS.Feedback.Inline({ type: 'info', title: L('Insight:', 'Insight:'), text: L('Volume meningkat 8% dibanding periode sebelumnya. Puncak hari Sabtu.', 'Volume is up 8% on the previous period. Saturday is the peak.') }) + '</div>';
    },
    AlertCenter: function () {
      return '<div class="ds-stack ds-gap-3">' +
        DS.Card.Alert({ level: 'critical', title: L('2 order overdue SLA', '2 orders overdue SLA'), act: L('Lihat', 'View') }) +
        DS.Card.Alert({ level: 'warning', title: L('5 order berisiko terlambat', '5 orders at risk of being late'), act: L('Lihat', 'View') }) +
        DS.Card.Alert({ level: 'info', title: L('12 order menunggu pickup', '12 orders waiting for pickup'), act: L('Lihat', 'View') }) +
        DS.Button.Text({ label: L('Lihat Semua Alert', 'View All Alerts'), icon: 'arrow' }) + '</div>';
    },
    DrillDown: function () {
      var path = [L('Revenue', 'Revenue'), L('Per Klien', 'Per Client'), 'Hotel ABC', L('Order', 'Order'), L('Invoice', 'Invoice')];
      return '<div class="ds-stack ds-gap-3">' + DS.Nav.Breadcrumb({ items: path.slice(0, 3) }) +
        '<ol class="ds-drill">' + path.map(function (p, i) { return '<li class="' + (i === 2 ? 'is-current' : (i < 2 ? 'is-done' : '')) + '"><span>' + t(p) + '</span>' + (i === 0 ? '<b>Rp125.4 jt</b>' : (i === 1 ? '<b>38 ' + t(L('klien', 'clients')) + '</b>' : (i === 2 ? '<b>Rp24.6 jt</b>' : (i === 3 ? '<b>312</b>' : '<b>INV-0925</b>')))) + '</li>'; }).join('') + '</ol>' +
        DS.Feedback.Inline({ type: 'info', text: L('Filter periode dan klien tetap terbawa di setiap level, jadi konteks tidak hilang.', 'Period and client filters carry through every level, so context is never lost.') }) + '</div>';
    },
    ManagementTable: function () {
      return '<div class="ds-stack ds-gap-4">' + DS.Data.FilterBar({ filters: [[L('Klien', 'Client'), [L('Semua Klien', 'All Clients'), 'Hotel ABC', 'Villa Sunset']], [L('Status', 'Status'), [L('Semua Status', 'All Status'), L('Menunggu', 'Waiting'), L('Diproses', 'In Process'), L('Selesai', 'Completed')]]] }) +
        DS.Data.Table({ caption: L('Daftar order', 'Order list'), cols: [{ k: 'd', l: L('Tanggal', 'Date'), sort: 'asc' }, { k: 'o', l: L('Order ID', 'Order ID'), strong: true }, { k: 'c', l: L('Klien', 'Client') }, { k: 'w', l: L('Berat', 'Weight'), num: true }, { k: 'sla', l: 'SLA' }, { k: 's', l: L('Status', 'Status'), chip: true }, { k: 'a', l: L('Aksi', 'Action'), act: true }],
          rows: [{ d: '25 Sep 2024', o: 'LND-001', c: 'Hotel ABC', w: '82.4 kg', sla: '18:00', s: 'Waiting' }, { d: '25 Sep 2024', o: 'LND-002', c: 'Villa Sunset', w: '46.2 kg', sla: '17:00', s: 'Processing' }, { d: '24 Sep 2024', o: 'LND-003', c: 'Hotel Indigo', w: '91.2 kg', sla: '16:00', s: 'Completed' }, { d: '24 Sep 2024', o: 'LND-004', c: 'The Kayon', w: '38.6 kg', sla: '12:00', s: 'Late' }] }) +
        DS.Data.Pagination({ pages: 5, current: 1 }) + '</div>';
    },
    Approval: function () {
      return '<div class="ds-card ds-card--lg ds-stack">' + '<div class="ds-row ds-row--between"><div><p class="ds-caption">' + t(L('Perubahan Rate · Hotel ABC', 'Rate Change · Hotel ABC')) + '</p><h3 class="ds-h3">' + t(L('Persetujuan Rate Baru', 'New Rate Approval')) + '</h3></div>' + DS.Status.Waiting({ label: L('Menunggu Persetujuan', 'Awaiting Approval') }) + '</div>' +
        '<div class="ds-compare"><div><span class="ds-caption">' + t(L('Rate Lama', 'Old Rate')) + '</span><b class="ds-tabular">Rp8.500/kg</b></div>' + ic('arrow', 'i-lg') + '<div class="is-new"><span class="ds-caption">' + t(L('Rate Baru', 'New Rate')) + '</span><b class="ds-tabular">Rp9.000/kg</b></div></div>' +
        '<dl class="ds-dl"><div><dt>' + t(L('Alasan', 'Reason')) + '</dt><dd>' + t(L('Perpanjangan Kontrak', 'Contract Renewal')) + '</dd></div><div><dt>' + t(L('Diajukan', 'Requested by')) + '</dt><dd>Komang Ari · Sales · 25 Sep 10:12</dd></div><div><dt>' + t(L('Berlaku', 'Effective')) + '</dt><dd>1 Okt 2024</dd></div></dl>' +
        '<div class="ds-dialog__actions">' + DS.Button.DangerSoft({ label: L('TOLAK', 'REJECT'), icon: 'x', act: 'reject' }) + DS.Button.Success({ label: L('SETUJUI', 'APPROVE'), icon: 'check', act: 'approve' }) + '</div>' +
        '<p class="ds-caption">' + ic('history') + ' ' + t(L('Setiap keputusan tercatat di audit trail: user, waktu, nilai lama → baru, alasan.', 'Every decision is written to the audit trail: user, time, old → new value, reason.')) + '</p></div>';
    }
  };

  /* ---------- Behaviour (opt-in, progressive) ---------- */
  DS.toast = function (o) {
    var box = document.querySelector('.ds-toaster');
    if (!box) { box = document.createElement('div'); box.className = 'ds-toaster ds'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    box.insertAdjacentHTML('beforeend', DS.Feedback.Toast(o));
    var el = box.lastElementChild; DS.lang(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, o.ms || 4200);
  };
  // Apply the current language to freshly inserted nodes and bilingual attributes
  DS.reveal = function (btn) {
    var inp = btn.parentNode.querySelector('input'); if (!inp) return;
    var show = inp.type === 'password', lang = root.JF && root.JF.lang ? root.JF.lang() : 'id';
    inp.type = show ? 'text' : 'password';
    btn.setAttribute('aria-pressed', show);
    var lab = show ? L('Sembunyikan password', 'Hide password') : L('Tampilkan password', 'Show password');
    btn.setAttribute('aria-label', lang === 'en' ? lab[1] : lab[0]); btn.setAttribute('data-aria-label-en', lab[1]); btn['__aria-label'] = lab[0];
    btn.innerHTML = ic(show ? 'eyeoff' : 'eye');
  };
  DS.lang = function (scope) {
    var lang = root.JF && root.JF.lang ? root.JF.lang() : 'id';
    scope = scope || document;
    var els = scope.querySelectorAll ? scope.querySelectorAll('[data-en]') : [];
    for (var i = 0; i < els.length; i++) { var el = els[i]; if (el.__id === undefined) el.__id = el.innerHTML; el.innerHTML = lang === 'en' ? el.getAttribute('data-en') : el.__id; }
    ['placeholder', 'aria-label', 'data-label'].forEach(function (a) {
      var list = (scope.querySelectorAll ? scope : document).querySelectorAll('[data-' + a + '-en]');
      for (var j = 0; j < list.length; j++) { var e = list[j], k = '__' + a; if (e[k] === undefined) e[k] = e.getAttribute(a); e.setAttribute(a, lang === 'en' ? e.getAttribute('data-' + a + '-en') : e[k]); }
    });
  };
  var lastFocus = null;
  function openModal(key) {
    var m = document.querySelector('[data-modal="' + key + '"]');
    if (!m) return;
    lastFocus = document.activeElement; m.hidden = false;
    var f = m.querySelector('button, [href], input'); if (f) f.focus();
  }
  function closeModal(m) { m.hidden = true; if (lastFocus) lastFocus.focus(); }
  DS.boot = function () {
    if (DS._booted) return; DS._booted = true;
    if (root.JF && root.JF.onLang) root.JF.onLang(function () { DS.lang(document); });
    DS.lang(document);
    document.addEventListener('click', function (e) {
      var tgt = e.target.closest ? e.target : e.target.parentNode;
      var x;
      if ((x = tgt.closest('[data-dismiss]'))) { var tt = x.closest('.ds-toast'); if (tt) tt.parentNode.removeChild(tt); return; }
      if ((x = tgt.closest('[data-reveal]'))) { DS.reveal(x); return; }
      if ((x = tgt.closest('[data-counter] button'))) { var inp = x.parentNode.querySelector('input'); inp.value = Math.max(0, (parseInt(inp.value, 10) || 0) + parseInt(x.getAttribute('data-step'), 10)); return; }
      if ((x = tgt.closest('[data-tabs] [role="tab"]'))) { var tabs = x.parentNode.querySelectorAll('[role="tab"]'); for (var i = 0; i < tabs.length; i++) { tabs[i].setAttribute('aria-selected', tabs[i] === x); tabs[i].tabIndex = tabs[i] === x ? 0 : -1; } return; }
      if ((x = tgt.closest('[data-segment] button'))) { var bs = x.parentNode.querySelectorAll('button'); for (var j = 0; j < bs.length; j++) bs[j].setAttribute('aria-pressed', bs[j] === x); return; }
      if ((x = tgt.closest('.ds-tip__btn'))) { var bub = x.parentNode.querySelector('.ds-tip__bubble'); var open = bub.hidden; bub.hidden = !open; x.setAttribute('aria-expanded', open); return; }
      if ((x = tgt.closest('[data-open-modal]'))) { e.preventDefault(); openModal(x.getAttribute('data-open-modal')); return; }
      if ((x = tgt.closest('[data-open-drawer]'))) { e.preventDefault(); var d = document.querySelector('[data-drawer="' + x.getAttribute('data-open-drawer') + '"]'); if (d) { lastFocus = x; d.hidden = false; var b = d.querySelector('button'); if (b) b.focus(); } return; }
      if ((x = tgt.closest('[data-drawer] [data-close], [data-drawer] [data-act="close"]'))) { x.closest('[data-drawer]').hidden = true; if (lastFocus) lastFocus.focus(); return; }
      if ((x = tgt.closest('[data-modal] [data-act="close"]'))) { closeModal(x.closest('[data-modal]')); return; }
      if ((x = tgt.closest('[data-modal] [data-act="confirm"]'))) { closeModal(x.closest('[data-modal]')); DS.toast({ type: 'success', text: L('Proses dibatalkan. Data tidak tersimpan.', 'Process cancelled. Nothing was saved.') }); return; }
      if ((x = tgt.closest('[data-modal]')) && tgt === x) { closeModal(x); return; }
      if ((x = tgt.closest('[data-toast]'))) { var ty = x.getAttribute('data-toast'); DS.toast({ type: ty, text: { success: L('Data berhasil disimpan.', 'Data saved.'), info: L('Informasi telah diperbarui.', 'Information updated.'), warning: L('SLA hampir habis.', 'SLA almost due.'), error: L('Terjadi kesalahan. Coba lagi.', 'Something went wrong. Try again.') }[ty] }); return; }
      if ((x = tgt.closest('[data-loading-demo]'))) { x.classList.add('is-loading'); x.setAttribute('aria-busy', 'true'); setTimeout(function () { x.classList.remove('is-loading'); x.removeAttribute('aria-busy'); DS.toast({ type: 'success', text: L('Cucian berhasil diterima.', 'Laundry received.') }); }, 1400); return; }
      if ((x = tgt.closest('a[href="#"]'))) e.preventDefault();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var m = document.querySelector('[data-modal]:not([hidden])'); if (m) closeModal(m);
        var d = document.querySelector('[data-drawer]:not([hidden])'); if (d) { d.hidden = true; if (lastFocus) lastFocus.focus(); }
        var b = document.querySelectorAll('.ds-tip__bubble:not([hidden])'); for (var i = 0; i < b.length; i++) if (!b[i].closest('.ds-tip--static')) { b[i].hidden = true; b[i].previousElementSibling.setAttribute('aria-expanded', 'false'); }
      }
      // Arrow keys move between tabs
      var tab = e.target.closest && e.target.closest('[data-tabs] [role="tab"]');
      if (tab && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        var all = Array.prototype.slice.call(tab.parentNode.querySelectorAll('[role="tab"]')), i2 = all.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : -1);
        var nx = all[(i2 + all.length) % all.length]; nx.focus(); nx.click();
      }
      // Simple focus trap inside an open modal
      if (e.key === 'Tab') {
        var mm = document.querySelector('[data-modal]:not([hidden])');
        if (mm) { var f = mm.querySelectorAll('button, [href], input, select, textarea'); if (!f.length) return; var first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
      }
    });
    // Drag-over styling for uploads
    ['dragenter', 'dragover'].forEach(function (ev) { document.addEventListener(ev, function (e) { var u = e.target.closest && e.target.closest('[data-upload]'); if (u) { e.preventDefault(); u.classList.add('is-over'); } }); });
    ['dragleave', 'drop'].forEach(function (ev) { document.addEventListener(ev, function (e) { var u = e.target.closest && e.target.closest('[data-upload]'); if (u) { e.preventDefault(); u.classList.remove('is-over'); } }); });
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DS;
  root.JFDS = DS;
})(typeof window !== 'undefined' ? window : this);
