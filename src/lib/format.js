export const shortHash = (h, l = 4) => (h ? `${h.slice(0, 2 + l)}…${h.slice(-l)}` : "-");
// "···· 8C21", the way the designs show a wallet.
export const walletTail = (a) => (a ? `···· ${a.slice(-4).toUpperCase()}` : "");
// "7F3A…C21E", the way the designs show a payment reference.
export const refTail = (h) => (h ? `${h.slice(2, 6).toUpperCase()}…${h.slice(-4).toUpperCase()}` : "-");

export const num = (n) => Number(n).toLocaleString("en-US");
export const alke = (n) => `${num(n)} ALKE`;

export const initials = (name = "") =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const day = (ts) => { const d = new Date(ts); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
export const date = (ts) => `${day(ts)} ${new Date(ts).getFullYear()}`;
export const monthYear = (ts) => `${MONTHS[new Date(ts).getMonth()]} ${new Date(ts).getFullYear()}`;
export const weekday = (ts) => `${DAYS[new Date(ts).getDay()]} ${day(ts)}`;
export const time = (ts) => new Date(ts).toTimeString().slice(0, 5);
export const dateTime = (ts) => `${date(ts)}, ${time(ts)}`;
export const monthName = (ts) => FULL_MONTHS[new Date(ts).getMonth()];

export function relativeDay(ts) {
  const today = new Date().setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(ts).setHours(0, 0, 0, 0) - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return day(ts);
}

export function countdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function timeLeft(ms) {
  const h = Math.max(0, Math.round(ms / 3600000));
  if (h >= 48) return `${Math.round(h / 24)} days`;
  if (h >= 1) return h === 1 ? "1 hour" : `${h} hours`;
  return `${Math.max(1, Math.round(ms / 60000))} minutes`;
}

export const fileSize = (bytes) =>
  bytes >= 1e6 ? `${Math.round(bytes / 1e5) / 10} MB` : bytes >= 1e3 ? `${Math.round(bytes / 1e3)} KB` : `${bytes} B`;
