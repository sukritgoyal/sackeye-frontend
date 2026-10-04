import { useMemo } from 'react';
import { fetchImageUrls } from '../api/timeRanges';

const BATCH = 100;
const DELAY_MS = 40;

/**
 * Gallery tiles each need a signed image link. Asking one by one would be hundreds of requests, so requests made
 * within a few milliseconds are grouped into one call. Returns { get(path, force?) -> Promise<url> }.
 */
export const useImageUrls = (cameraId) => useMemo(() => {
  const cache = new Map();   // path -> Promise<url>
  let queue = [];
  let timer = null;

  const flush = async () => {
    timer = null;
    const waiting = queue; queue = [];
    for (let i = 0; i < waiting.length; i += BATCH) {
      const chunk = waiting.slice(i, i + BATCH);
      try {
        const urls = await fetchImageUrls(cameraId, chunk.map((w) => w.path));
        chunk.forEach((w) => (urls[w.path] ? w.resolve(urls[w.path]) : w.reject(new Error('no link'))));
      } catch (err) {
        chunk.forEach((w) => w.reject(err));
      }
    }
  };

  const get = (path, force = false) => {
    if (!force && cache.has(path)) return cache.get(path);
    const p = new Promise((resolve, reject) => { queue.push({ path, resolve, reject }); });
    p.catch(() => cache.delete(path));                    // a failed link can be asked for again
    cache.set(path, p);
    if (!timer) timer = setTimeout(flush, DELAY_MS);
    return p;
  };
  return { get };
}, [cameraId]);
