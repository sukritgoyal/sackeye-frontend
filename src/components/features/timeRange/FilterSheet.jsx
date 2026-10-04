import React from 'react';
import BottomSheet from './BottomSheet';
import { FILTER_DEFAULTS } from '../../../utils/timeRange';

const Slider = ({ label, value, display, min, max, step, hint, onChange }) => (
  <div className="my-3">
    <div className="flex justify-between font-semibold"><span>{label}</span><span>{display}</span></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="h-[34px] w-full accent-[#2457d6] dark:accent-[#6f95ff]" />
    {hint && <div className="text-[12.5px] text-[#6a7485] dark:text-[#9aa4b5]">{hint}</div>}
  </div>
);

const Switch = ({ label, hint, checked, onChange }) => (
  <div className="my-3 flex items-center justify-between gap-3">
    <div>
      <div className="font-semibold">{label}</div>
      {hint && <div className="text-[12.5px] text-[#6a7485] dark:text-[#9aa4b5]">{hint}</div>}
    </div>
    <button
      role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors ${checked ? 'bg-[#2457d6] dark:bg-[#6f95ff]' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

/** Confidence / area / joining filters plus "show all frames" and "include night". */
const FilterSheet = ({ isOpen, filters, onChange, summary, onClose }) => {
  const set = (patch) => onChange({ ...filters, ...patch });
  return (
    <BottomSheet isOpen={isOpen} title="Filters" onClose={onClose}>
      <Switch label="Show all frames" hint="List every frame of the day instead of only the detected truck ranges." checked={filters.showAll} onChange={(v) => set({ showAll: v })} />
      <Slider label="Confidence at least" value={filters.conf} display={`≥ ${filters.conf.toFixed(2)}`} min={0.25} max={0.95} step={0.05} hint="Higher = fewer, surer detections." onChange={(v) => set({ conf: v })} />
      <Slider label="Truck box area at least" value={filters.area} display={`≥ ${filters.area}%`} min={0} max={40} step={0.5} hint="Share of the picture the truck covers. Raise it to ignore small or far-away trucks." onChange={(v) => set({ area: v })} />
      <Slider label="Join detections closer than" value={filters.gap} display={`${filters.gap} min`} min={0} max={30} step={1} onChange={(v) => set({ gap: v })} />
      <Slider label="Ignore stays shorter than" value={filters.stay} display={`${filters.stay} min`} min={1} max={30} step={1} onChange={(v) => set({ stay: v })} />
      <Switch label="Include night" hint="11 PM – 5 AM" checked={filters.night} onChange={(v) => set({ night: v })} />
      <div className="my-2 text-[12.5px] text-[#6a7485] dark:text-[#9aa4b5]">{summary}</div>
      <div className="flex items-center justify-between">
        <button onClick={() => onChange({ ...FILTER_DEFAULTS, showAll: filters.showAll, night: filters.night })} className="px-1 py-2 text-red-600 dark:text-red-400">Reset</button>
        <button onClick={onClose} className="rounded-[10px] bg-[#2457d6] px-4 py-2.5 font-semibold text-white dark:bg-[#6f95ff] dark:text-[#0b1020]">Done</button>
      </div>
      <div className="mt-2 text-[12.5px] text-[#6a7485] dark:text-[#9aa4b5]">A time you already picked stays in the gallery even if its image is filtered out.</div>
    </BottomSheet>
  );
};

export default FilterSheet;
