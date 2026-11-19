/* ===== AYARLAR ===== */
var CFG = {
  weekMin: 3000,        // haftalık minimum XP (✅ / ❌ sınırı)
  excused: [],          // mazeretli oyuncular: ["oyuncuAdi"]
  staleHours: 3         // veri bu kadar saatten eskiyse uyar
};
/* =================== */
var $ = function (i) { return document.getElementById(i); };
var f = function (n) { return Number(n || 0).toLocaleString("tr-TR"); };
var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); };
var D = null, key = "w", flt = "all";

document.addEventListener("click", function (e) {
  var h = e.target.closest(".acc-h");
  if (!h) return;
  var item = h.parentElement, open = !item.classList.contains("open");
  if (!item.classList.contains("sub")) {
    document.querySelectorAll(".accordion > .acc").forEach(function (a) {
      a.classList.remove("open"); a.querySelector(".acc-h").setAttribute("aria-expanded", "false");
    });
  }
  item.classList.toggle("open", open);
  h.setAttribute("aria-expanded", open);
});

function rel(s) {
  if (!s) return "—";
  var n = Math.floor((Date.now() - new Date(s).getTime()) / 864e5);
  return n <= 0 ? "bugün" : n === 1 ? "dün" : n + " gün önce";
}
function ok(m) { return m.w >= CFG.weekMin || CFG.excused.indexOf(m.name) > -1; }

function render() {
  var M = D.members, sum = function (k) { return M.reduce(function (a, m) { return a + m[k]; }, 0); };
  $("stats").innerHTML = [["Üye", M.length], ["Bugün", "+" + f(sum("d"))], ["Haftalık", "+" + f(sum("w"))], ["Aylık", "+" + f(sum("m"))]]
    .map(function (x) { return '<div class="stat"><b>' + x[1] + '</b><span>' + x[0] + '</span></div>'; }).join("");

  var good = M.filter(ok).length, bad = M.length - good;
  $("chips").innerHTML =
    '<button class="chip' + (flt === "all" ? " on" : "") + '" data-f="all">Tümü ' + M.length + '</button>' +
    '<button class="chip' + (flt === "ok" ? " on" : "") + '" data-f="ok">✅ ' + good + '</button>' +
    '<button class="chip bad' + (flt === "bad" ? " on" : "") + '" data-f="bad">❌ ' + bad + '</button>';

  var hrs = (Date.now() - new Date(D.updated).getTime()) / 36e5, u = $("upd");
  u.textContent = "🔄 Son güncelleme: " + new Date(D.updated).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }) +
    " · Haftalık hedef: " + f(CFG.weekMin) + " XP" + (hrs > CFG.staleHours ? " · ⚠️ Veri güncel olmayabilir" : "");
  u.className = "note" + (hrs > CFG.staleHours ? " warn" : "");

  $("left").innerHTML = D.left && D.left.length
    ? D.left.slice(0, 30).map(function (l) { return '<p><s>' + esc(l.name) + '</s> · ' + f(l.xp) + ' XP · ' + esc(l.date) + '</p>'; }).join("")
    : "<p>Henüz ayrılan yok.</p>";
  list();
}

function list() {
  var q = $("q").value.toLowerCase();
  var x = D.members.slice().sort(function (a, b) { return b[key] - a[key]; });
  var mx = (x[0] && x[0][key]) || 1, rows = [];
  x.forEach(function (m, i) {
    var g = ok(m);
    if (flt === "ok" && !g) return;
    if (flt === "bad" && g) return;
    if (q && m.name.toLowerCase().indexOf(q) < 0) return;
    var pct = key === "w" ? Math.min(100, Math.round(m.w / CFG.weekMin * 100)) : Math.round(m[key] / mx * 100);
    var ex = CFG.excused.indexOf(m.name) > -1;
    rows.push('<div class="row' + (g ? "" : " bad") + '"><div class="rk">' + (i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1) + '</div>' +
      '<div class="in"><div class="nm"><span>' + esc(m.name) + (ex ? '<span class="tag">🛡️ MAZERETLİ</span>' : "") + '</span><span>' + f(m[key]) + '</span></div>' +
      '<div class="sub-t">Son aktif: ' + rel(m.last) + ' · Toplam ' + f(m.xp) + '</div>' +
      '<div class="bar"><i style="width:' + pct + '%"></i></div></div>' +
      '<div class="st">' + (ex ? "🛡️" : g ? "✅" : "❌") + '</div></div>');
  });
  $("list").innerHTML = rows.join("") || '<p class="empty">Sonuç yok.</p>';
}

$("seg").addEventListener("click", function (e) {
  var k = e.target.dataset.k; if (!k) return; key = k;
  [].forEach.call($("seg").children, function (b) { b.classList.toggle("on", b.dataset.k === k); });
  list();
});
$("chips").addEventListener("click", function (e) { var v = e.target.dataset.f; if (v) { flt = v; render(); } });
$("q").addEventListener("input", list);

function load() {
  fetch("data/members.json?t=" + Date.now())
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (j) { D = j; render(); })
    .catch(function () {
      if (!D) { $("list").innerHTML = '<p class="empty">XP verisi henüz yüklenmedi. GitHub Actions ilk çalıştırmadan sonra burada görünecek.</p>'; $("left").innerHTML = ""; }
    });
}
load();
setInterval(load, 300000);

/* ===== TEMA SEÇİCİ ===== */
var THEMES = [
  { id: "inci",   n: "KARA İNCİ",     e: "𓊝",  c: ["#00f2fe", "#ff0055"], m: "#05040a" },
  { id: "korsan", n: "Korsan",        e: "🏴‍☠️", c: ["#f5b83d", "#d9381e"], m: "#0e0b08" },
  { id: "kurt",   n: "Kurt",          e: "🐺",  c: ["#a5c0de", "#e5484d"], m: "#090b0f" },
  { id: "orman",  n: "Büyülü Orman",  e: "🌲",  c: ["#6ee7b7", "#fde047"], m: "#06120b" },
  { id: "sihir",  n: "Sihir",         e: "🔮",  c: ["#c084fc", "#ff4fd8"], m: "#0a0614" },
  { id: "ask",    n: "Aşk",           e: "💖",  c: ["#ff6b9d", "#ff2e63"], m: "#14060d" },
  { id: "futbol", n: "Futbol",        e: "⚽",  c: ["#f8fafc", "#fbbf24"], m: "#04140a" },
  { id: "yaris",  n: "Yarış Arabası", e: "🏎️", c: ["#ff3b30", "#ffd60a"], m: "#09090a" }
];
(function () {
  var root = document.documentElement;
  var pearl = document.querySelector(".pearl");
  var meta = document.querySelector('meta[name="theme-color"]');

  var btn = document.createElement("button");
  btn.className = "fab fab-theme";
  btn.textContent = "🎨";
  btn.setAttribute("aria-label", "Tema seç");
  document.body.appendChild(btn);

  var sh = document.createElement("div");
  sh.className = "tp";
  sh.innerHTML = '<div class="tp-box"><h3>🎨 Tema Seç</h3><div class="tp-grid">' +
    THEMES.map(function (t) {
      return '<button class="tp-it" data-id="' + t.id + '"><span class="tp-e">' + t.e + '</span><b>' + t.n +
        '</b><span class="tp-d"><i style="background:' + t.c[0] + '"></i><i style="background:' + t.c[1] + '"></i></span></button>';
    }).join("") + '</div></div>';
  document.body.appendChild(sh);

  function setTheme(id, save) {
    var t = THEMES.filter(function (x) { return x.id === id; })[0] || THEMES[0];
    root.dataset.theme = t.id;
    if (pearl) pearl.textContent = t.e;
    if (meta) meta.setAttribute("content", t.m);
    [].forEach.call(sh.querySelectorAll(".tp-it"), function (b) { b.classList.toggle("on", b.dataset.id === t.id); });
    if (save) { try { localStorage.setItem("kiTheme", t.id); } catch (e) {} }
  }

  btn.addEventListener("click", function () { sh.classList.add("open"); });
  sh.addEventListener("click", function (e) {
    if (e.target === sh) { sh.classList.remove("open"); return; }
    var it = e.target.closest(".tp-it");
    if (it) { setTheme(it.dataset.id, true); sh.classList.remove("open"); }
  });

  var saved = null;
  try { saved = localStorage.getItem("kiTheme"); } catch (e) {}
  setTheme(saved || "inci", false);
})();
/* ===== TEMALI SES EFEKTLERİ ===== */
(function () {
  var AC = window.AudioContext || window.webkitAudioContext, ctx = null, on = true;
  try { on = localStorage.getItem("kiSound") !== "0"; } catch (e) {}

  function tone(freq, dur, type, vol, slide) {
    if (!on || !AC) return;
    try {
      ctx = ctx || new AC();
      if (ctx.state === "suspended") ctx.resume();
      var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(vol || 0.07, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + dur);
    } catch (e) {}
  }
  /* nota: [frekans, süre, dalga, ses, kayma, gecikme(ms)] */
  var P = {
    inci: {
      tap: [[520,.07,"sine",.07,380]], open: [[420,.12,"triangle",.07,720]], close: [[640,.12,"triangle",.07,380]],
      pick: [[660,.09,"sine",.08],[990,.14,"sine",.08,0,80]], fab: [[300,.15,"square",.04,600]]
    },
    korsan: {
      tap: [[160,.09,"sawtooth",.05,110]],
      open: [[196,.14,"sawtooth",.05],[294,.18,"sawtooth",.05,0,110]],
      close: [[294,.14,"sawtooth",.05],[196,.18,"sawtooth",.05,0,110]],
      pick: [[880,.5,"sine",.07],[1320,.45,"sine",.04,0,10],[660,.5,"sine",.05,0,150]],
      fab: [[130,.2,"sawtooth",.06,90],[196,.25,"sawtooth",.05,0,150]]
    },
    kurt: {
      tap: [[130,.08,"sine",.12,70]],
      open: [[300,.35,"sine",.08,620]], close: [[620,.35,"sine",.08,280]],
      pick: [[330,.5,"sine",.08,700],[700,.4,"sine",.06,420,380]],
      fab: [[250,.4,"sine",.08,520]]
    },
    orman: {
      tap: [[1400,.06,"sine",.05,1900]],
      open: [[1000,.1,"sine",.05,1500],[1500,.12,"sine",.05,2000,90]],
      close: [[1800,.1,"sine",.05,1200],[1300,.12,"sine",.05,900,90]],
      pick: [[784,.12,"triangle",.06],[988,.12,"triangle",.06,0,90],[1319,.2,"triangle",.06,0,180]],
      fab: [[1200,.08,"sine",.05,1800],[1800,.1,"sine",.05,2300,100]]
    },
    sihir: {
      tap: [[1200,.08,"triangle",.05,1700]],
      open: [[523,.1,"triangle",.06],[659,.1,"triangle",.06,0,70],[784,.1,"triangle",.06,0,140],[1047,.2,"triangle",.06,0,210]],
      close: [[1047,.1,"triangle",.06],[784,.1,"triangle",.06,0,70],[659,.1,"triangle",.06,0,140],[523,.2,"triangle",.06,0,210]],
      pick: [[1047,.1,"triangle",.06],[1319,.1,"triangle",.06,0,90],[1568,.1,"triangle",.06,0,180],[2093,.3,"triangle",.06,0,270]],
      fab: [[880,.1,"sine",.05,1760],[1760,.2,"triangle",.05,0,100]]
    },
    ask: {
      tap: [[700,.08,"sine",.07,900]],
      open: [[523,.2,"sine",.07],[659,.25,"sine",.07,0,110]],
      close: [[659,.2,"sine",.07],[523,.25,"sine",.07,0,110]],
      pick: [[523,.25,"sine",.07],[659,.25,"sine",.07,0,100],[784,.4,"sine",.07,0,200]],
      fab: [[784,.18,"sine",.07],[988,.3,"sine",.07,0,120]]
    },
    futbol: {
      tap: [[200,.07,"sine",.12,60]],
      open: [[2200,.12,"sine",.05]], close: [[1800,.12,"sine",.05]],
      pick: [[2600,.14,"triangle",.06],[2600,.14,"triangle",.06,0,170],[2800,.3,"triangle",.06,0,340]],
      fab: [[2800,.35,"triangle",.06,2400]]
    },
    yaris: {
      tap: [[900,.04,"square",.04,600]],
      open: [[90,.35,"sawtooth",.05,420]], close: [[420,.35,"sawtooth",.05,100]],
      pick: [[100,.5,"sawtooth",.06,700]],
      fab: [[120,.3,"sawtooth",.05,500],[500,.15,"square",.03,260,250]]
    }
  };
  function play(name) {
    var set = P[document.documentElement.dataset.theme] || P.inci;
    (set[name] || []).forEach(function (n) {
      setTimeout(function () { tone(n[0], n[1], n[2], n[3], n[4]); }, n[5] || 0);
    });
  }

  document.addEventListener("click", function (e) {
    var t = e.target, acc = t.closest(".acc-h");
    if (acc) {
      var item = acc.parentElement;
      setTimeout(function () { play(item.classList.contains("open") ? "open" : "close"); }, 0);
    } else if (t.closest(".tp-it")) play("pick");
    else if (t.closest(".fab")) play("fab");
    else if (t.closest(".seg button, .chip")) play("tap");
  });

  var box = document.querySelector(".tp-box");
  if (box) {
    var sb = document.createElement("button");
    sb.className = "chip";
    sb.style.cssText = "margin-top:14px;width:100%;padding:11px";
    var label = function () { sb.textContent = on ? "🔊 Ses: Açık" : "🔇 Ses: Kapalı"; };
    label();
    sb.addEventListener("click", function () {
      on = !on;
      try { localStorage.setItem("kiSound", on ? "1" : "0"); } catch (e) {}
      label();
    });
    box.appendChild(sb);
  }
})();
/* ===== ÇEKİLİŞ ===== */
var GIVEAWAY = {
  active: true,                 // false yaparsan "aktif çekiliş yok" yazar
  title: "Haftalık Çekiliş",
  prize: "Ücretsiz görev",
  end: "Pazar 23:59",
  rule: "ok",                   // "ok" = haftalık hedefi yapanlar, "all" = herkes
  exclude: [],                  // katılamayacak oyuncular: ["TheiaRyu"]
  winners: []                   // {name:"oyuncu", prize:"Ücretsiz görev", date:"20.11.2026"}
};
(function () {
  var box = document.getElementById("gv");
  if (!box) return;
  var admin = location.hash === "#yonetici", spinning = false, last = null;

  function pool() {
    if (!D) return [];
    return D.members.filter(function (m) {
      return GIVEAWAY.exclude.indexOf(m.name) < 0 && (GIVEAWAY.rule === "all" || ok(m));
    });
  }
  function rnd(n) { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
  function wins() {
    var w = GIVEAWAY.winners;
    if (!w.length) return "";
    return "<p><b>🏆 Geçmiş kazananlar</b></p>" + w.slice().reverse().map(function (x) {
      return "<p>" + esc(x.name) + " · " + esc(x.prize) + " · " + esc(x.date) + "</p>";
    }).join("");
  }
  function view() {
    var g = GIVEAWAY, p = pool();
    if (!g.active) { box.innerHTML = "<p>Şu an aktif çekiliş yok.</p>" + wins(); return; }
    var h = "<p><b>" + esc(g.title) + "</b></p><p>🎁 Ödül: " + esc(g.prize) + "<br>⏰ Bitiş: " + esc(g.end) +
      "<br>📋 Şart: " + (g.rule === "all" ? "Tüm klan üyeleri" : "Haftalık " + f(CFG.weekMin) + " XP hedefini yapanlar") +
      "<br>🎟️ Şu an katılabilen: " + (D ? p.length : "…") + " kişi</p>";
    if (admin) {
      h += '<div class="gv-stage' + (last ? " won" : "") + '" id="gv-stage">' + (last ? "🏆 " + esc(last) : "🎁") + "</div>" +
        '<button class="chip" id="gv-go" style="width:100%;padding:11px">🎲 Çekilişi Başlat</button>';
    } else {
      h += "<p>Çekiliş sonucu burada duyurulur.</p>";
    }
    box.innerHTML = h + wins();
  }
  function draw() {
    var p = pool();
    if (!p.length || spinning) return;
    var win = p[rnd(p.length)], st = document.getElementById("gv-stage"), i = 0, delay = 60;
    spinning = true; last = null;
    st.classList.remove("won");
    (function step() {
      if (i++ < 28) {
        st.textContent = p[rnd(p.length)].name;
        delay += 8;
        setTimeout(step, delay);
      } else {
        st.textContent = "🏆 " + win.name;
        st.classList.add("won");
        last = win.name;
        spinning = false;
      }
    })();
  }
  box.addEventListener("click", function (e) { if (e.target.id === "gv-go") draw(); });
  view();
  setInterval(function () { if (!spinning) view(); }, 3000);
})();
