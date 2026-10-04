// Pure helpers for the time-range screen. All clock times are India Standard Time (UTC+05:30, no DST).
export const MIN = 60000;
export const HOUR = 3600000;
export const IST_OFFSET = 330 * MIN;
export const CONTEXT_MS = 15 * MIN;       // frames shown before/after a range when it is expanded
export const MAX_RANGE_MS = 60 * MIN;     // longest range the server accepts
export const MIN_AGE_MS = 10 * MIN;       // the last 10 minutes are still being recorded

const pad = (n) => String(n).padStart(2, '0');
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const istParts = (ms) => {
  const d = new Date(ms + IST_OFFSET);
  return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), wd: d.getUTCDay(), s: d.toISOString().slice(0, 10) };
};
export const clock = (ms) => { const p = istParts(ms); return `${pad(p.h)}:${pad(p.mi)}`; };
export const dayLabel = (ms) => { const p = istParts(ms); return `${DOW[p.wd]} ${p.d} ${MON[p.mo]}`; };
export const dayStartOf = (ms) => Date.parse(`${istParts(ms).s}T00:00:00+05:30`);
export const dayStartFromInput = (yyyyMmDd) => Date.parse(`${yyyyMmDd}T00:00:00+05:30`);
export const dateInputValue = (ms) => istParts(ms).s;
export const toIso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z');
/** "YYYY-MM-DD HH:MM:SS" in IST: the format the jobs API expects. */
export const istStamp = (ms) => { const p = istParts(ms); return `${p.s} ${pad(p.h)}:${pad(p.mi)}:00`; };

/** 10 -> "10 min", 95 -> "1 h 35 m · 95 min" */
export const durationText = (ms) => {
  const m = Math.round(ms / MIN);
  if (m < 60) return `${m} min`;
  const r = m % 60;
  return `${Math.floor(m / 60)} h${r ? ` ${r} m` : ''} · ${m} min`;
};

export const FILTER_DEFAULTS = { conf: 0.35, area: 0, gap: 2, stay: 2, night: false, showAll: false };

/** Truck boxes of a frame that pass the confidence and area filters. */
export const visibleBoxes = (frame, { conf, area }) =>
  frame.boxes.filter((b) => b[4] >= conf && (((b[2] - b[0]) * (b[3] - b[1])) / (frame.w * frame.h)) * 100 >= area);

/** Merge frames with a truck into ranges: bridge gaps <= gap minutes, drop stays shorter than `stay` minutes. */
export const computeRanges = (frames, filters) => {
  const out = [];
  for (const f of frames) {
    if (!visibleBoxes(f, filters).length) continue;
    const last = out[out.length - 1];
    if (last && (f.ms - last.end) / MIN - 1 <= filters.gap) { last.end = f.ms; last.n += 1; }
    else out.push({ start: f.ms, end: f.ms, n: 1 });
  }
  return out.filter((r) => (r.end - r.start) / MIN + 1 >= filters.stay);
};

/**
 * What the gallery lists.
 *  - showAll: one section with every frame.
 *  - otherwise one section per detected range; an expanded range also lists the frames from CONTEXT_MS before/after it.
 *    A frame appears once (first section that claims it). A picked start/end hidden by the filters gets its own small section.
 */
export const buildSections = ({ frames, byMs, ranges, expanded, pins, showAll }) => {
  if (showAll) return frames.length ? [{ kind: 'all', frames, at: frames[0].ms }] : [];
  const claimed = new Set();
  const coreIndex = (ms) => ranges.findIndex((r) => ms >= r.start && ms <= r.end);
  const sections = ranges.map((r, i) => {
    const open = expanded.has(r.start);
    const lo = r.start - (open ? CONTEXT_MS : 0), hi = r.end + (open ? CONTEXT_MS : 0);
    const own = frames.filter((f) => f.ms >= lo && f.ms <= hi && !claimed.has(f.ms) && (coreIndex(f.ms) === -1 || coreIndex(f.ms) === i));
    own.forEach((f) => claimed.add(f.ms));
    return { kind: 'range', index: i, range: r, open, frames: own, at: r.start };
  });
  for (const ms of pins) {
    if (ms != null && byMs.has(ms) && !claimed.has(ms)) { claimed.add(ms); sections.push({ kind: 'pin', ms, frames: [byMs.get(ms)], at: ms }); }
  }
  return sections.sort((a, b) => a.at - b.at);
};
