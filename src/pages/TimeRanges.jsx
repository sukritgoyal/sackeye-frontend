import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { submitTimeRanges, startDetection, fetchDetectionRun } from '../api/timeRanges';
import { useDayFrames } from '../hooks/useDayFrames';
import { useImageUrls } from '../hooks/useImageUrls';
import AlertDialog from '../components/common/AlertDialog';
import Loader from '../components/common/Loader';
import TimeRangeNav from '../components/features/timeRange/TimeRangeNav';
import RangeBar from '../components/features/timeRange/RangeBar';
import DayControls from '../components/features/timeRange/DayControls';
import FrameGallery from '../components/features/timeRange/FrameGallery';
import FrameViewer from '../components/features/timeRange/FrameViewer';
import DetectionBar from '../components/features/timeRange/DetectionBar';
import FilterSheet from '../components/features/timeRange/FilterSheet';
import SelectedRangesSheet from '../components/features/timeRange/SelectedRangesSheet';
import TimeScrubber from '../components/features/timeRange/TimeScrubber';
import {
  MIN, HOUR, MAX_RANGE_MS, MIN_AGE_MS, FILTER_DEFAULTS, dayLabel, dayStartOf, istStamp,
  computeRanges, buildSections, visibleBoxes,
} from '../utils/timeRange';

const IDLE = { step: 'idle', start: null, end: null };

/**
 * Pick time ranges by looking at the frames (no need to open the camera footage) and submit them.
 * Each submitted range becomes a job whose video is prepared on the server; inference is not run.
 * Everything chosen here lives in memory only.
 */
const TimeRanges = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rootRef = useRef(null);

  const [cameras, setCameras] = useState([]);
  const [cameraId, setCameraId] = useState(searchParams.get('camera') || '');
  const [todayMs] = useState(() => dayStartOf(Date.now()));
  const [dayMs, setDayMs] = useState(todayMs);
  const [nowMs, setNowMs] = useState(() => Math.floor(Date.now() / MIN) * MIN);
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [expanded, setExpanded] = useState(() => new Set());
  const [selection, setSelection] = useState(IDLE);
  const [picked, setPicked] = useState([]);                  // ranges chosen so far (not saved anywhere until submitted)
  const [current, setCurrent] = useState(0);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitResult, setSubmitResult] = useState(null);
  const [toast, setToast] = useState('');

  const [detect, setDetect] = useState({ confirm: false, running: false, elapsed: 0, error: '' });
  const mounted = useRef(true);
  const lockUntil = useRef(0);
  const anchor = useRef(null);                               // what to keep in place when the list re-renders
  const toastTimer = useRef(0);

  const camera = cameras.find((c) => c._id === cameraId);
  const showToast = useCallback((text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }, []);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  // ---- cameras
  useEffect(() => {
    api.get('/api/cameras').then((res) => {
      setCameras(res.data);
      setCameraId((id) => id || res.data[0]?._id || '');
    }).catch((err) => console.error('[TimeRanges] Failed to fetch cameras', err));
  }, []);

  // ---- frames of the chosen day: 05:00-23:00 IST, or the whole day when night is included
  const winFrom = dayMs + (filters.night ? 0 : 5 * HOUR);
  const winTo = Math.min(dayMs + (filters.night ? 24 : 23) * HOUR, nowMs + MIN);
  const { frames, loading, error, reload } = useDayFrames(cameraId, winFrom, winTo);
  const imageUrls = useImageUrls(cameraId);

  const byMs = useMemo(() => new Map(frames.map((f) => [f.ms, f])), [frames]);
  const { conf, area, gap, stay, showAll } = filters;
  // Truck detection only exists for frames it has been run on. The truck-range view (arrows, Expand, filters) is used only
  // when every frame of the day has been checked; otherwise the day is shown as plain frames so none are hidden.
  const missing = useMemo(() => frames.filter((f) => f.processed === false).length, [frames]);
  const fullyChecked = frames.length > 0 && missing === 0;
  const viewAll = showAll || !fullyChecked;
  const detected = useMemo(() => computeRanges(frames, { conf, area, gap, stay }), [frames, conf, area, gap, stay]);
  const sections = useMemo(
    () => buildSections({ frames, byMs, ranges: detected, expanded, pins: [selection.start, selection.end], showAll: viewAll }),
    [frames, byMs, detected, expanded, selection.start, selection.end, viewAll],
  );
  const listed = useMemo(() => sections.flatMap((s) => s.frames), [sections]);
  const currentIndex = Math.min(current, Math.max(detected.length - 1, 0));

  // ---- keep what the user is looking at in place when tiles are added/removed above it
  useLayoutEffect(() => {
    const a = anchor.current;
    if (!a) return;
    let el = null;
    if (a.header != null) el = document.querySelector(`[data-ri="${a.header}"]`);
    else if (a.ms != null) {
      const f = listed.find((x) => x.ms >= a.ms);
      el = f && document.querySelector(`[data-ms="${f.ms}"]`);
    }
    if (el) { const d = el.getBoundingClientRect().top - a.top; if (Math.abs(d) > 1) window.scrollBy(0, d); }
  }, [sections, listed]);

  // ---- the range bar follows the scroll position
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const barBottom = rootRef.current ? parseFloat(getComputedStyle(rootRef.current).paddingTop) : 102;
        const tiles = document.querySelectorAll('[data-ms]');
        let lo = 0, hi = tiles.length - 1, found = -1;                       // first tile below the sticky bars
        while (lo <= hi) { const mid = (lo + hi) >> 1; if (tiles[mid].getBoundingClientRect().top >= barBottom) { found = mid; hi = mid - 1; } else lo = mid + 1; }
        if (found < 0) return;
        const ms = +tiles[found].dataset.ms;
        anchor.current = { ms, top: tiles[found].getBoundingClientRect().top };
        if (Date.now() < lockUntil.current || !detected.length) return;
        const i = detected.findIndex((r) => r.end >= ms);
        setCurrent(i < 0 ? detected.length - 1 : i);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [detected]);

  // ---- warn before losing ranges that were not submitted
  useEffect(() => {
    if (!picked.length) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [picked.length]);

  // ---- day / camera
  const resetView = () => { anchor.current = null; setExpanded(new Set()); setCurrent(0); window.scrollTo(0, 0); };
  const changeDay = (ms) => { setNowMs(Math.floor(Date.now() / MIN) * MIN); setDayMs(ms); resetView(); };
  const changeCamera = (id) => { setCameraId(id); setSelection(IDLE); resetView(); };
  const changeFilters = (next) => {
    if (next.night !== filters.night) resetView();
    setFilters(next);
  };

  // ---- expand / navigate
  const toggleExpand = (start) => {
    const ri = detected.findIndex((r) => r.start === start);
    const head = document.querySelector(`[data-ri="${ri}"]`);
    anchor.current = head ? { header: ri, top: head.getBoundingClientRect().top } : anchor.current;
    setExpanded((prev) => { const next = new Set(prev); if (next.has(start)) next.delete(start); else next.add(start); return next; });
  };
  const scrollTo = (el) => { if (!el) return; lockUntil.current = Date.now() + 700; el.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
  const goTo = (i) => {
    if (!detected.length) return;
    const idx = Math.max(0, Math.min(i, detected.length - 1));
    setCurrent(idx);
    const header = document.querySelector(`[data-ri="${idx}"]`);
    const first = listed.find((f) => f.ms >= detected[idx].start);
    scrollTo(header || (first && document.querySelector(`[data-ms="${first.ms}"]`)));
  };

  // ---- picking a range
  const pick = (ms) => {
    const { step, start } = selection;
    if (step === 'idle') return;
    if (step === 'start') { setSelection({ step: 'end', start: ms, end: null }); return; }
    if (ms === start) { showToast('Pick a different time for the end'); return; }
    const lo = Math.min(start, ms), hi = Math.max(start, ms);
    if (hi - lo > MAX_RANGE_MS) { showToast('A range can be at most 1 hour'); return; }
    if (hi > Date.now() - MIN_AGE_MS) { showToast('The last 10 minutes are still being recorded. Pick an earlier image.'); return; }
    setSelection({ step: 'ready', start: lo, end: hi });
  };
  const confirmSelection = () => {
    const { start, end } = selection;
    if (picked.some((r) => r.cameraId === cameraId && start < r.e && end > r.s)) { showToast('This overlaps a range you already selected'); return; }
    setPicked((prev) => [...prev, { id: `${cameraId}-${start}-${end}`, cameraId, cameraName: camera?.name || '', s: start, e: end }]);
    setSelection(IDLE);
    setSubmitResult(null);
    showToast('Range added');
  };

  const tileClick = (ms) => (selection.step === 'idle' ? setViewerIndex(listed.findIndex((f) => f.ms === ms)) : pick(ms));

  // ---- list sheet: jump / submit
  const jumpTo = async (r) => {
    setListOpen(false);
    if (r.cameraId !== cameraId) changeCamera(r.cameraId);
    changeDay(dayStartOf(r.s));
    setTimeout(() => {
      const f = document.querySelector(`[data-ms="${r.s}"]`);
      if (f) scrollTo(f); else showToast('Open Expand on the nearest truck range to see that time');
    }, 1200);
  };
  const submit = async () => {
    setSubmitting(true); setSubmitError('');
    const done = new Set();
    let created = 0, skipped = 0, firstCamera = null;
    try {
      const byCamera = new Map();
      picked.forEach((r) => { if (!byCamera.has(r.cameraId)) byCamera.set(r.cameraId, []); byCamera.get(r.cameraId).push(r); });
      for (const [id, list] of byCamera) {
        const data = await submitTimeRanges(id, list.map((r) => ({ startTime: istStamp(r.s), endTime: istStamp(r.e) })));
        created += data.jobs.length; skipped += data.skipped.length; firstCamera = firstCamera || id;
        list.forEach((r) => done.add(r.id));
      }
      setSubmitResult({ created, skipped, cameraId: firstCamera });
    } catch (err) {
      setSubmitError(err.response?.data?.msg || err.message);
    } finally {
      setPicked((prev) => prev.filter((r) => !done.has(r.id)));
      setSubmitting(false);
    }
  };

  // ---- run truck detection for this day's frames that have no result yet
  const runDetection = async () => {
    setDetect({ confirm: false, running: true, elapsed: 0, error: '' });
    try {
      let run = await startDetection(cameraId, winFrom, winTo);
      while (run.status === 'running') {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        if (!mounted.current) return;
        run = await fetchDetectionRun(cameraId, run.id);
        setDetect((d) => ({ ...d, elapsed: run.elapsed_s }));
      }
      if (run.status === 'done') {
        await reload();
        showToast(run.detected ? `Detection finished on ${run.detected} frames` : 'Detection finished');
        setDetect({ confirm: false, running: false, elapsed: 0, error: '' });
      } else {
        setDetect({ confirm: false, running: false, elapsed: 0, error: run.status === 'busy' ? 'Another detection run is in progress.' : 'Detection failed. Please try again.' });
      }
    } catch (err) {
      setDetect({ confirm: false, running: false, elapsed: 0, error: err.response?.data?.msg || err.message });
    }
  };

  const back = () => (picked.length ? setLeaveOpen(true) : navigate('/cameras'));
  const pickedHere = useMemo(() => picked.filter((r) => r.cameraId === cameraId), [picked, cameraId]);
  const subtitle = `${dayLabel(dayMs)} · ${camera?.name || ''}`;
  const hits = frames.filter((f) => visibleBoxes(f, filters).length).length;
  const filtersActive = fullyChecked ? (conf !== FILTER_DEFAULTS.conf || area !== FILTER_DEFAULTS.area || showAll) : filters.night;

  return (
    <div ref={rootRef} className="relative mx-auto min-h-screen w-full max-w-md bg-[#f3f4f7] pt-[calc(102px+env(safe-area-inset-top))] font-display text-[15px] text-[#1b2330] antialiased dark:bg-[#12161d] dark:text-[#e8ecf3]">
      <TimeRangeNav
        step={selection.step} start={selection.start} end={selection.end} count={picked.length}
        onOpenList={() => { setSubmitResult(null); setListOpen(true); }}
        onAdd={() => setSelection({ step: 'start', start: null, end: null })}
        onConfirm={confirmSelection} onCancel={() => setSelection(IDLE)}
      />
      <RangeBar
        ranges={detected} current={currentIndex} subtitle={subtitle} hasFrames={frames.length > 0} frameCount={frames.length} showNav={fullyChecked} loading={loading} filtersActive={filtersActive}
        onPrev={() => goTo(currentIndex - 1)} onNext={() => goTo(currentIndex + 1)} onJump={() => goTo(currentIndex)} onOpenFilters={() => setFiltersOpen(true)}
      />
      <DayControls cameras={cameras} cameraId={cameraId} onCameraChange={changeCamera} dayMs={dayMs} todayMs={todayMs} onDayChange={changeDay} onBack={back} />

      {!loading && !error && missing > 0 && (
        <DetectionBar missing={missing} running={detect.running} elapsed={detect.elapsed} error={detect.error} onRun={() => setDetect((d) => ({ ...d, confirm: true, error: '' }))} />
      )}

      {loading && <div className="flex justify-center py-16"><Loader size="md" text="Loading frames…" /></div>}
      {!loading && error && <div className="mx-3 mt-1.5 rounded-[10px] border border-[#dfe3ea] bg-white p-3 text-sm dark:border-[#2f3745] dark:bg-[#1c222c]">{error}</div>}
      {!loading && !error && !sections.length && (
        <div className="px-5 py-10 text-center text-[#6a7485] dark:text-[#9aa4b5]">
          {frames.length ? 'No truck found with the current filters. Try lowering them.' : 'No frames for this day and camera.'}
        </div>
      )}
      {!loading && !error && (
        <FrameGallery
          sections={sections} imageUrls={imageUrls} selection={selection} pendingRanges={pickedHere} reserveRight={viewAll}
          onTileClick={tileClick} onZoom={(ms) => setViewerIndex(listed.findIndex((f) => f.ms === ms))} onToggleExpand={toggleExpand}
        />
      )}

      {viewAll && !loading && !error && listed.length > 0 && <TimeScrubber layoutKey={listed.length} selection={selection} pendingRanges={pickedHere} />}

      <FilterSheet
        isOpen={filtersOpen} filters={filters} hasDetections={fullyChecked} onChange={changeFilters} onClose={() => setFiltersOpen(false)}
        summary={`${detected.length} truck range(s) · ${hits} of ${frames.length} frames with a truck`}
      />
      <SelectedRangesSheet
        isOpen={listOpen} items={picked} submitting={submitting} error={submitError} result={submitResult}
        onRemove={(id) => setPicked((prev) => prev.filter((r) => r.id !== id))}
        onClearAll={() => setPicked([])} onJump={jumpTo} onSubmit={submit}
        onViewJobs={() => navigate(`/history/${submitResult?.cameraId || cameraId}`)} onClose={() => { setListOpen(false); setSubmitResult(null); setSubmitError(''); }}
      />
      {viewerIndex != null && listed[viewerIndex] && (
        <FrameViewer frames={listed} index={viewerIndex} filters={filters} imageUrls={imageUrls} onChange={setViewerIndex} onClose={() => setViewerIndex(null)} />
      )}
      <AlertDialog
        isOpen={detect.confirm} onClose={() => setDetect((d) => ({ ...d, confirm: false }))} onConfirm={runDetection}
        title="Run truck detection?" message={`This runs detection in the cloud on the ${missing} frame${missing === 1 ? '' : 's'} of ${dayLabel(dayMs)} that have not been checked yet. It can take a few minutes and has a small cost.`}
        cancelText="Cancel" confirmText="Run" icon="play_circle" variant="blue"
      />
      <AlertDialog
        isOpen={leaveOpen} onClose={() => setLeaveOpen(false)} onConfirm={() => navigate('/cameras')}
        title="Leave without submitting?" message={`You have ${picked.length} selected time range${picked.length === 1 ? '' : 's'} that ${picked.length === 1 ? 'has' : 'have'} not been submitted. They will be lost.`}
        cancelText="Stay" confirmText="Leave" icon="warning" variant="amber"
      />
      {toast && <div className="fixed left-1/2 top-[calc(112px+env(safe-area-inset-top))] z-[220] max-w-[90vw] -translate-x-1/2 rounded-full bg-[#111] px-4 py-2.5 text-center text-sm text-white opacity-95">{toast}</div>}
    </div>
  );
};

export default TimeRanges;
