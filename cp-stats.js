/**
 * Fills elements with [data-cp="path.to.value"] from competitive programming stats.
 * - Uses embedded defaults FIRST (works with file:// and double-click open).
 * - If cp-data.json loads (e.g. Live Server), it overrides with fresh data.
 */
(function () {
  // Keep defaults as "--" until live data arrives.
  var CP_DATA_FALLBACK = {};

  function formatVal(v) {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'number' && !Number.isInteger(v)) {
      return String(Math.round(v * 100) / 100);
    }
    return String(v);
  }

  function getByPath(obj, path) {
    return path.split('.').reduce(function (o, k) {
      return o && o[k] !== undefined ? o[k] : undefined;
    }, obj);
  }

  function applyCpData(data) {
    if (!data) return;
    document.querySelectorAll('[data-cp]').forEach(function (el) {
      var path = el.getAttribute('data-cp');
      if (!path) return;
      var raw = getByPath(data, path);
      if (raw === undefined) {
        el.textContent = el.dataset.cpFallback || '—';
        return;
      }
      if (el.dataset.cpSuffix) {
        el.textContent = formatVal(raw) + el.dataset.cpSuffix;
      } else {
        el.textContent = formatVal(raw);
      }
    });

    // Show human-readable last live update time where requested.
    var ts = data.fetchedAt ? new Date(data.fetchedAt) : null;
    var label = ts && !isNaN(ts.getTime())
      ? ts.toLocaleString()
      : 'Using fallback data';
    document.querySelectorAll('[data-cp-updated]').forEach(function (el) {
      el.textContent = label;
    });
  }

  function applyStatus(text) {
    document.querySelectorAll('[data-cp-status]').forEach(function (el) {
      el.textContent = text;
    });
  }

  function mergeDeep(base, patch) {
    if (!patch) return base;
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(patch).forEach(function (k) {
      var bv = out[k];
      var pv = patch[k];
      if (pv && typeof pv === 'object' && !Array.isArray(pv)) {
        out[k] = mergeDeep(bv && typeof bv === 'object' ? bv : {}, pv);
      } else if (pv !== undefined) {
        out[k] = pv;
      }
    });
    return out;
  }

  function loadCpData() {
    var current = CP_DATA_FALLBACK;
    window.CP_DATA_FALLBACK = CP_DATA_FALLBACK;
    window.CP_CURRENT_DATA = current;
    applyCpData(current);

    // cp-live.js dispatches this when latest platform data arrives.
    document.addEventListener('cp-live-data', function (ev) {
      var incoming = ev && ev.detail ? ev.detail : null;
      if (!incoming) return;
      current = mergeDeep(current, incoming);
      window.CP_CURRENT_DATA = current;
      applyCpData(current);
    });

    document.addEventListener('cp-live-status', function (ev) {
      var st = ev && ev.detail ? ev.detail : {};
      if (st.state === 'loading') applyStatus('Refreshing live data...');
      else if (st.state === 'ok') applyStatus('Live data is up to date.');
      else if (st.state === 'error') applyStatus('Live fetch failed, values remain -- until success.');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCpData);
  } else {
    loadCpData();
  }
})();
