(function () {
  "use strict";

  var STORAGE_KEY = "keuangan_transactions_v1";

  var EXPENSE_CATEGORIES = [
    { id: "makanan", name: "Makanan", icon: "🍽️", color: "#C9A24B" },
    { id: "transportasi", name: "Transportasi", icon: "🚗", color: "#7FA7C9" },
    { id: "belanja", name: "Belanja", icon: "🛍️", color: "#C1666B" },
    { id: "tagihan", name: "Tagihan", icon: "🧾", color: "#9C8AC4" },
    { id: "hiburan", name: "Hiburan", icon: "🎬", color: "#D98E52" },
    { id: "kesehatan", name: "Kesehatan", icon: "❤️", color: "#6FA287" },
    { id: "lainnya_exp", name: "Lainnya", icon: "⋯", color: "#8A8496" }
  ];
  var INCOME_CATEGORIES = [
    { id: "gaji", name: "Gaji", icon: "💼", color: "#6FA287" },
    { id: "bonus", name: "Bonus", icon: "🎁", color: "#C9A24B" },
    { id: "lainnya_inc", name: "Lainnya", icon: "⋯", color: "#8A8496" }
  ];
  var ALL_CATEGORIES = EXPENSE_CATEGORIES.concat(INCOME_CATEGORIES);

  function getCategory(id) {
    for (var i = 0; i < ALL_CATEGORIES.length; i++) if (ALL_CATEGORIES[i].id === id) return ALL_CATEGORIES[i];
    return ALL_CATEGORIES[ALL_CATEGORIES.length - 1];
  }

  function formatIDR(n) {
    var v = Math.round(Number(n) || 0);
    return "Rp " + v.toLocaleString("id-ID");
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function monthLabel(d) {
    return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }

  function inMonth(t, ref) {
    var d = new Date(t.date);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s == null ? "" : String(s);
    return div.innerHTML;
  }

  // ---------- state ----------
  var state = {
    transactions: [],
    tab: "dashboard",
    showAdd: false,
    addType: "expense",
    addCategory: EXPENSE_CATEGORIES[0].id,
    refMonth: (function () { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })(),
    toast: null
  };

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state.transactions = JSON.parse(raw);
    } catch (e) { /* ignore */ }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
    } catch (e) {
      showToast("Gagal menyimpan data");
    }
  }

  function showToast(msg) {
    state.toast = msg;
    render();
    setTimeout(function () { state.toast = null; render(); }, 2200);
  }

  function addTransaction(tx) {
    tx.id = uid();
    state.transactions.unshift(tx);
    saveData();
    state.showAdd = false;
    render();
    showToast(tx.type === "income" ? "Pemasukan ditambahkan" : "Pengeluaran ditambahkan");
  }

  function deleteTransaction(id) {
    state.transactions = state.transactions.filter(function (t) { return t.id !== id; });
    saveData();
    render();
    showToast("Transaksi dihapus");
  }

  function getMonthTx(ref) {
    return state.transactions.filter(function (t) { return inMonth(t, ref); })
      .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  }

  function getTotals(monthTx) {
    var income = 0, expense = 0;
    monthTx.forEach(function (t) {
      if (t.type === "income") income += Number(t.amount); else expense += Number(t.amount);
    });
    return { income: income, expense: expense, net: income - expense };
  }

  function getBalance() {
    var b = 0;
    state.transactions.forEach(function (t) { b += (t.type === "income" ? 1 : -1) * Number(t.amount); });
    return b;
  }

  // ---------- icons (inline svg) ----------
  var ICONS = {
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    pie: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="#C9A24B" stroke-width="2"><path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><path d="M18 12h.01"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="#6FA287" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="#C1666B" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="#6B6478" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
    chevLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="#C9A24B" stroke-width="2.4"><polyline points="15 18 9 12 15 6"/></svg>',
    chevRight: '<svg viewBox="0 0 24 24" fill="none" stroke="#C9A24B" stroke-width="2.4"><polyline points="9 18 15 12 9 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="#8A8496" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  };

  // ---------- rendering ----------
  function render() {
    var root = document.getElementById("root");
    var monthTx = getMonthTx(state.refMonth);
    var totals = getTotals(monthTx);
    var balance = getBalance();

    var bodyHtml = "";
    if (state.tab === "dashboard") bodyHtml = renderDashboard(balance, totals, monthTx);
    else if (state.tab === "transaksi") bodyHtml = renderTransaksi(monthTx);
    else bodyHtml = renderLaporan(totals, monthTx);

    root.innerHTML =
      '<div class="phone">' +
        '<div class="header">' +
          '<div><div class="eyebrow">Dompet Pribadi</div><div class="header-title">Keuangan Saya</div></div>' +
          '<div class="wallet-badge">' + ICONS.wallet + '</div>' +
        '</div>' +
        '<div class="body scroll" id="body">' + bodyHtml + '</div>' +
        '<button class="fab" id="fab">+</button>' +
        '<div class="bottom-nav">' +
          navBtn("dashboard", ICONS.grid, "Dashboard") +
          navBtn("transaksi", ICONS.list, "Transaksi") +
          navBtn("laporan", ICONS.pie, "Laporan") +
        '</div>' +
        (state.showAdd ? renderAddSheet() : "") +
        (state.toast ? '<div class="toast">' + escapeHtml(state.toast) + '</div>' : "") +
      '</div>';

    attachEvents();
  }

  function navBtn(tab, icon, label) {
    return '<button class="nav-btn ' + (state.tab === tab ? "active" : "") + '" data-nav="' + tab + '">' + icon + '<span>' + label + '</span></button>';
  }

  function renderDashboard(balance, totals, monthTx) {
    var recent = state.transactions.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 5);
    return (
      '<div class="balance-card">' +
        '<div class="balance-label">Saldo Total</div>' +
        '<div class="balance-value">' + formatIDR(balance) + '</div>' +
        '<div class="gold-rule"></div>' +
        '<div class="stat-row">' +
          statChip(ICONS.up, "Pemasukan", totals.income, true) +
          statChip(ICONS.down, "Pengeluaran", totals.expense, false) +
        '</div>' +
      '</div>' +
      monthSwitcher() +
      '<div class="section-row"><div class="section-title">Transaksi Terbaru</div><button class="link-btn" data-nav="transaksi">Lihat semua</button></div>' +
      (recent.length === 0 ? emptyState("Belum ada transaksi. Ketuk tombol + untuk mulai mencatat.") :
        '<div class="tx-list">' + recent.map(function (t) { return txRow(t, false); }).join("") + '</div>')
    );
  }

  function renderTransaksi(monthTx) {
    var grouped = {};
    var order = [];
    monthTx.forEach(function (t) {
      var key = new Date(t.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
      if (!grouped[key]) { grouped[key] = []; order.push(key); }
      grouped[key].push(t);
    });
    var html = '<div class="section-title">Semua Transaksi</div>' + monthSwitcher();
    if (monthTx.length === 0) {
      html += emptyState("Tidak ada transaksi di bulan ini.");
    } else {
      order.forEach(function (key) {
        html += '<div style="margin-bottom:16px"><div class="date-group-label">' + escapeHtml(key) + '</div><div class="tx-list">' +
          grouped[key].map(function (t) { return txRow(t, true); }).join("") + '</div></div>';
      });
    }
    return html;
  }

  function renderLaporan(totals, monthTx) {
    var byCat = {};
    monthTx.forEach(function (t) {
      if (t.type !== "expense") return;
      byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount);
    });
    var pieData = Object.keys(byCat).map(function (catId) {
      var c = getCategory(catId);
      return { name: c.name, value: byCat[catId], color: c.color };
    }).sort(function (a, b) { return b.value - a.value; });

    var months = [];
    for (var i = 5; i >= 0; i--) {
      months.push(new Date(state.refMonth.getFullYear(), state.refMonth.getMonth() - i, 1));
    }
    var barData = months.map(function (d) {
      var inc = 0, exp = 0;
      state.transactions.forEach(function (t) {
        if (inMonth(t, d)) { if (t.type === "income") inc += Number(t.amount); else exp += Number(t.amount); }
      });
      return { label: d.toLocaleDateString("id-ID", { month: "short" }), inc: inc, exp: exp };
    });

    var html = '<div class="section-title">Laporan Keuangan</div><div class="sub-label">' + monthLabel(state.refMonth) + '</div>';
    html += '<div class="chart-card"><div class="stat-chip-label">Selisih Bulan Ini</div><div class="balance-value" style="font-size:22px;color:' + (totals.net >= 0 ? "#8FC1A6" : "#D98A8E") + '">' + formatIDR(totals.net) + '</div></div>';

    html += '<div class="chart-card"><div class="chart-title">Pengeluaran per Kategori</div>';
    if (pieData.length === 0) {
      html += emptyState("Belum ada pengeluaran bulan ini.", true);
    } else {
      html += renderDonut(pieData);
      html += '<div class="legend-wrap">' + pieData.map(function (e) {
        return '<div class="legend-item"><span class="legend-dot" style="background:' + e.color + '"></span><span class="legend-text">' + escapeHtml(e.name) + '</span><span class="legend-value">' + formatIDR(e.value) + '</span></div>';
      }).join("") + '</div>';
    }
    html += '</div>';

    html += '<div class="chart-card"><div class="chart-title">Tren 6 Bulan Terakhir</div>';
    html += '<div class="bar-legend"><span class="bar-legend-item"><span class="legend-dot" style="background:#6FA287"></span>Pemasukan</span><span class="bar-legend-item"><span class="legend-dot" style="background:#C1666B"></span>Pengeluaran</span></div>';
    html += renderBarChart(barData);
    html += '</div>';

    return html;
  }

  function renderDonut(pieData) {
    var total = pieData.reduce(function (s, d) { return s + d.value; }, 0) || 1;
    var r = 60, cx = 90, cy = 90, circumference = 2 * Math.PI * r;
    var offset = 0;
    var segments = pieData.map(function (d) {
      var frac = d.value / total;
      var len = frac * circumference;
      var seg = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + d.color + '" stroke-width="22" stroke-dasharray="' + len + ' ' + (circumference - len) + '" stroke-dashoffset="' + (-offset) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')" />';
      offset += len;
      return seg;
    }).join("");
    return '<div style="display:flex;justify-content:center"><svg width="180" height="180" viewBox="0 0 180 180">' + segments + '</svg></div>';
  }

  function renderBarChart(barData) {
    var max = 1;
    barData.forEach(function (d) { max = Math.max(max, d.inc, d.exp); });
    var cols = barData.map(function (d) {
      var incH = Math.round((d.inc / max) * 110);
      var expH = Math.round((d.exp / max) * 110);
      return '<div class="bar-col">' +
        '<div class="bar-pair">' +
          '<div class="bar" style="height:' + Math.max(incH, 2) + 'px;background:#6FA287"></div>' +
          '<div class="bar" style="height:' + Math.max(expH, 2) + 'px;background:#C1666B"></div>' +
        '</div>' +
        '<div class="bar-month-label">' + escapeHtml(d.label) + '</div>' +
      '</div>';
    }).join("");
    return '<div class="bar-chart">' + cols + '</div>';
  }

  function statChip(icon, label, value, positive) {
    return '<div class="stat-chip" style="border-color:' + (positive ? "rgba(111,162,135,0.35)" : "rgba(193,102,107,0.35)") + '">' +
      '<span style="width:14px;height:14px;display:inline-flex">' + icon + '</span>' +
      '<div><div class="stat-chip-label">' + label + '</div><div class="stat-chip-value" style="color:' + (positive ? "#8FC1A6" : "#D98A8E") + '">' + formatIDR(value) + '</div></div>' +
    '</div>';
  }

  function monthSwitcher() {
    return '<div class="month-switcher">' +
      '<button class="month-arrow" data-month="-1">' + ICONS.chevLeft + '</button>' +
      '<span class="month-label">' + monthLabel(state.refMonth) + '</span>' +
      '<button class="month-arrow" data-month="1">' + ICONS.chevRight + '</button>' +
    '</div>';
  }

  function txRow(t, showDelete) {
    var cat = getCategory(t.category);
    var isIncome = t.type === "income";
    var noteOrDate = t.note ? escapeHtml(t.note) : new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    return '<div class="tx-row">' +
      '<div class="tx-icon" style="background:' + cat.color + '22;border:1px solid ' + cat.color + '55"><span class="icon">' + cat.icon + '</span></div>' +
      '<div style="flex:1;min-width:0"><div class="tx-cat">' + escapeHtml(cat.name) + '</div><div class="tx-note">' + noteOrDate + '</div></div>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<div class="tx-amount" style="color:' + (isIncome ? "#8FC1A6" : "#D98A8E") + '">' + (isIncome ? "+" : "\u2212") + ' ' + formatIDR(t.amount) + '</div>' +
        (showDelete ? '<button class="delete-btn" data-delete="' + t.id + '">' + ICONS.trash + '</button>' : "") +
      '</div>' +
    '</div>';
  }

  function emptyState(text, small) {
    return '<div class="empty-state ' + (small ? "small" : "") + '"><div class="empty-dot"></div><div class="empty-text">' + escapeHtml(text) + '</div></div>';
  }

  function renderAddSheet() {
    var cats = state.addType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    var catGrid = cats.map(function (c) {
      var active = state.addCategory === c.id;
      return '<button class="cat-btn" data-cat="' + c.id + '" style="border-color:' + (active ? c.color : "#2A2634") + ';background:' + (active ? c.color + "1F" : "#1E1B26") + '">' +
        '<span class="icon">' + c.icon + '</span><span class="cat-btn-text" style="color:' + (active ? "#F0EDE6" : "#9C93A8") + '">' + escapeHtml(c.name) + '</span>' +
      '</button>';
    }).join("");

    return '<div class="overlay" id="overlay">' +
      '<div class="sheet" id="sheet">' +
        '<div class="sheet-handle"></div>' +
        '<div class="sheet-header"><div class="sheet-title">Tambah Transaksi</div><button class="close-btn" id="closeSheet">' + ICONS.close + '</button></div>' +
        '<div class="type-toggle">' +
          '<button class="type-toggle-btn ' + (state.addType === "expense" ? "active-exp" : "") + '" data-type="expense">Pengeluaran</button>' +
          '<button class="type-toggle-btn ' + (state.addType === "income" ? "active-inc" : "") + '" data-type="income">Pemasukan</button>' +
        '</div>' +
        '<div class="field-label">Jumlah</div>' +
        '<div class="amount-input-wrap"><span class="amount-prefix">Rp</span><input type="number" inputmode="numeric" placeholder="0" id="amountInput" class="amount-input" /></div>' +
        '<div class="field-label">Kategori</div>' +
        '<div class="cat-grid" id="catGrid">' + catGrid + '</div>' +
        '<div class="field-label">Catatan (opsional)</div>' +
        '<input type="text" placeholder="mis. Makan siang bersama tim" id="noteInput" class="text-input" />' +
        '<div class="field-label">Tanggal</div>' +
        '<input type="date" id="dateInput" class="text-input" value="' + todayISO() + '" />' +
        '<button class="save-btn" id="saveBtn" disabled>Simpan Transaksi</button>' +
      '</div>' +
    '</div>';
  }

  function attachEvents() {
    document.querySelectorAll("[data-nav]").forEach(function (el) {
      el.addEventListener("click", function () { state.tab = el.getAttribute("data-nav"); render(); });
    });
    document.querySelectorAll("[data-month]").forEach(function (el) {
      el.addEventListener("click", function () {
        var dir = parseInt(el.getAttribute("data-month"), 10);
        state.refMonth = new Date(state.refMonth.getFullYear(), state.refMonth.getMonth() + dir, 1);
        render();
      });
    });
    document.querySelectorAll("[data-delete]").forEach(function (el) {
      el.addEventListener("click", function () { deleteTransaction(el.getAttribute("data-delete")); });
    });
    var fab = document.getElementById("fab");
    if (fab) fab.addEventListener("click", function () {
      state.showAdd = true; state.addType = "expense"; state.addCategory = EXPENSE_CATEGORIES[0].id;
      render();
    });

    var overlay = document.getElementById("overlay");
    if (overlay) {
      overlay.addEventListener("click", function (e) { if (e.target === overlay) { state.showAdd = false; render(); } });
      var sheet = document.getElementById("sheet");
      sheet.addEventListener("click", function (e) { e.stopPropagation(); });

      document.getElementById("closeSheet").addEventListener("click", function () { state.showAdd = false; render(); });

      document.querySelectorAll("[data-type]").forEach(function (el) {
        el.addEventListener("click", function () {
          state.addType = el.getAttribute("data-type");
          var cats = state.addType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
          state.addCategory = cats[0].id;
          var amountVal = document.getElementById("amountInput").value;
          var noteVal = document.getElementById("noteInput").value;
          var dateVal = document.getElementById("dateInput").value;
          render();
          // restore field values after re-render
          document.getElementById("amountInput").value = amountVal;
          document.getElementById("noteInput").value = noteVal;
          document.getElementById("dateInput").value = dateVal || todayISO();
          checkSaveEnabled();
        });
      });

      document.querySelectorAll("[data-cat]").forEach(function (el) {
        el.addEventListener("click", function () {
          state.addCategory = el.getAttribute("data-cat");
          document.querySelectorAll("[data-cat]").forEach(function (b) {
            var c = getCategory(b.getAttribute("data-cat"));
            var active = b.getAttribute("data-cat") === state.addCategory;
            b.style.borderColor = active ? c.color : "#2A2634";
            b.style.background = active ? c.color + "1F" : "#1E1B26";
            b.querySelector(".cat-btn-text").style.color = active ? "#F0EDE6" : "#9C93A8";
          });
        });
      });

      var amountInput = document.getElementById("amountInput");
      amountInput.addEventListener("input", checkSaveEnabled);
      checkSaveEnabled();

      document.getElementById("saveBtn").addEventListener("click", function () {
        var amount = Number(document.getElementById("amountInput").value);
        if (!(amount > 0)) return;
        var note = document.getElementById("noteInput").value.trim();
        var date = document.getElementById("dateInput").value || todayISO();
        addTransaction({ type: state.addType, amount: amount, category: state.addCategory, note: note, date: date });
      });
    }
  }

  function checkSaveEnabled() {
    var amountInput = document.getElementById("amountInput");
    var saveBtn = document.getElementById("saveBtn");
    if (!amountInput || !saveBtn) return;
    saveBtn.disabled = !(Number(amountInput.value) > 0);
  }

  // ---------- init ----------
  loadData();
  render();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").catch(function () {});
    });
  }
})();
