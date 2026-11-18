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
