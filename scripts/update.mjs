import fs from "node:fs";
const KEY = process.env.WOV_API_KEY;
const CLAN = process.env.CLAN_ID || "089c5073-5ff4-4e7b-af0b-484409d5ba4b";
if (!KEY) { console.error("WOV_API_KEY yok"); process.exit(1); }
const H = { Authorization: `Bot ${KEY}` };
const API = "https://api.wolvesville.com";

async function get(path) {
  const r = await fetch(API + path, { headers: H });
  if (!r.ok) throw new Error(path + " -> " + r.status);
  return r.json();
}
let raw;
try { raw = await get(`/clans/${CLAN}/members/detailed`); }
catch (e) { console.log("detailed olmadı, /members deneniyor:", e.message); raw = await get(`/clans/${CLAN}/members`); }
if (!Array.isArray(raw)) raw = raw.members || [];

const cur = {};
for (const m of raw) {
  const id = m.playerId || m.id;
  cur[id] = {
    name: m.username || m.name || id,
    xp: Number(m.xp ?? m.totalXp ?? m.clanXp ?? 0),
    joined: String(m.joinDate || m.joinedAt || "").slice(0, 10),
    last: String(m.lastOnline || m.lastActive || "").slice(0, 10),
    role: m.status || m.role || m.rank || "",
    quest: m.participateInClanQuests ?? null,
  };
}

const tz = "Europe/Istanbul";
const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
const dt = new Date(today + "T00:00:00Z");
const monday = new Date(dt - ((dt.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
const month = today.slice(0, 7);

fs.mkdirSync("data", { recursive: true });
const SF = "data/state.json";
const xpMap = () => Object.fromEntries(Object.entries(cur).map(([k, v]) => [k, v.xp]));
let S = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF)) : null;
if (!S) S = { day: { d: today, xp: xpMap() }, week: { d: monday, xp: xpMap() }, month: { d: month, xp: xpMap() }, last: xpMap(), yest: {}, months: {}, known: {}, left: [] };

const diff = (a, b) => Object.fromEntries(Object.keys(b).map(k => [k, Math.max(0, b[k] - (a[k] ?? 0))]));
if (S.day.d !== today) { S.yest = diff(S.day.xp, S.last); S.day = { d: today, xp: S.last }; }
if (S.week.d !== monday) S.week = { d: monday, xp: S.last };
if (S.month.d !== month) { S.months[S.month.d] = diff(S.month.xp, S.last); S.month = { d: month, xp: S.last }; }

for (const id of Object.keys(S.known)) {
  if (!cur[id]) { S.left.unshift({ name: S.known[id].name, xp: S.known[id].xp, date: today }); delete S.known[id]; }
}
for (const id of Object.keys(cur)) S.known[id] = { name: cur[id].name, xp: cur[id].xp };
S.left = S.left.slice(0, 300);

const d = diff(S.day.xp, xpMap()), w = diff(S.week.xp, xpMap()), m = diff(S.month.xp, xpMap());
const members = Object.entries(cur).map(([id, v]) => ({
  id, name: v.name, role: v.role, joined: v.joined, last: v.last, quest: v.quest,
  xp: v.xp, d: d[id] || 0, y: S.yest[id] || 0, w: w[id] || 0, m: m[id] || 0,
}));
S.last = xpMap();

fs.writeFileSync(SF, JSON.stringify(S));
fs.writeFileSync("data/members.json", JSON.stringify({
  updated: new Date().toISOString(), members, left: S.left, months: S.months,
}));
console.log(members.length, "üye yazıldı");
