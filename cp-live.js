/**
 * Live CP updater:
 * - Fetches latest stats from public APIs on page load.
 * - Dispatches `cp-live-data` so cp-stats.js and cp-charts.js can refresh UI.
 */
(function () {
  var HANDLES = {
    codeforces: 'Yash_hacker_',
    leetcode: 'Yash-hacker-tech',
    hackerrank: 'y_sanghi2007',
    codechef: 'merry_frost_25'
  };

  function withTimeout(url, ms) {
    var ctrl = new AbortController();
    var t = setTimeout(function () { ctrl.abort(); }, ms || 7000);
    return fetch(url, { signal: ctrl.signal }).finally(function () { clearTimeout(t); });
  }

  function safeJson(url) {
    return withTimeout(url, 7000)
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function safeText(url) {
    return withTimeout(url, 7000)
      .then(function (r) { return r.ok ? r.text() : null; })
      .catch(function () { return null; });
  }

  function shortContestName(name) {
    if (!name) return 'Contest';
    return name
      .replace('Codeforces ', '')
      .replace('Educational ', 'Edu ')
      .replace('(Rated for Div. 2)', '')
      .trim();
  }

  function fetchCodeforces() {
    var infoUrl = 'https://codeforces.com/api/user.info?handles=' + encodeURIComponent(HANDLES.codeforces);
    var statusUrl = 'https://codeforces.com/api/user.status?handle=' + encodeURIComponent(HANDLES.codeforces) + '&from=1&count=10000';
    var ratingUrl = 'https://codeforces.com/api/user.rating?handle=' + encodeURIComponent(HANDLES.codeforces);

    return Promise.all([safeJson(infoUrl), safeJson(statusUrl), safeJson(ratingUrl)]).then(function (all) {
      var info = all[0];
      var status = all[1];
      var rating = all[2];
      if (!info || info.status !== 'OK' || !info.result || !info.result[0]) return null;

      var user = info.result[0];
      var solvedSet = new Set();
      if (status && status.status === 'OK' && Array.isArray(status.result)) {
        status.result.forEach(function (sub) {
          if (sub.verdict !== 'OK' || !sub.problem) return;
          var p = sub.problem;
          solvedSet.add((p.contestId || 'x') + ':' + (p.index || 'x') + ':' + (p.name || 'x'));
        });
      }

      var contestNames = [];
      var ratings = [];
      if (rating && rating.status === 'OK' && Array.isArray(rating.result)) {
        rating.result.forEach(function (r) {
          contestNames.push(shortContestName(r.contestName));
          ratings.push(r.newRating);
        });
      }

      return {
        codeforces: {
          handle: user.handle,
          rating: user.rating,
          maxRating: user.maxRating,
          rank: user.rank,
          maxRank: user.maxRank,
          problemsSolved: solvedSet.size || undefined
        },
        __chart: {
          codeforces: {
            contestNames: contestNames,
            ratings: ratings
          }
        }
      };
    });
  }

  function fetchLeetCode() {
    var profileUrl = 'https://alfa-leetcode-api.onrender.com/' + encodeURIComponent(HANDLES.leetcode) + '/profile';
    var contestUrl = 'https://alfa-leetcode-api.onrender.com/' + encodeURIComponent(HANDLES.leetcode) + '/contest';
    return Promise.all([safeJson(profileUrl), safeJson(contestUrl)]).then(function (all) {
      var p = all[0];
      var c = all[1];
      if (!p) return null;
      return {
        leetcode: {
          username: HANDLES.leetcode,
          totalSolved: p.totalSolved,
          easySolved: p.easySolved,
          mediumSolved: p.mediumSolved,
          hardSolved: p.hardSolved,
          contestRating: c && c.contestRating ? Math.round(c.contestRating * 100) / 100 : undefined,
          contestAttend: c ? c.contestAttend : undefined,
          globalRanking: p.ranking
        },
        __chart: {
          leetcode: {
            byDifficulty: {
              easy: p.easySolved,
              medium: p.mediumSolved,
              hard: p.hardSolved
            }
          }
        }
      };
    });
  }

  function fetchHackerRank() {
    var url = 'https://www.hackerrank.com/rest/contests/master/hackers/' + encodeURIComponent(HANDLES.hackerrank) + '/profile';
    return safeJson(url).then(function (data) {
      if (!data || !data.model) return null;
      return {
        hackerrank: {
          username: data.model.username || HANDLES.hackerrank,
          level: data.model.level,
          title: (data.model.title || '').replace(/<[^>]+>/g, '')
        },
        __chart: {
          hackerrank: {
            level: data.model.level
          }
        }
      };
    });
  }

  function extractInt(text, regex) {
    var m = text && text.match(regex);
    return m ? parseInt(m[1], 10) : undefined;
  }

  function fetchCodeChef() {
    // AllOrigins raw endpoint avoids CORS issues when opening from browsers.
    var rawUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.codechef.com/users/' + HANDLES.codechef);
    return safeText(rawUrl).then(function (html) {
      if (!html) return null;
      var rating = extractInt(html, /\[(\d+)\?\s*\(\+\d+\)\]\s*Rating/i);
      var solved = extractInt(html, /Total Problems Solved:\s*(\d+)/i);
      var stars = extractInt(html, /Username:\s*(\d)\u2605/i);
      var contests = extractInt(html, /No\.\s*of Contests Participated:\s*(\d+)/i);
      return {
        codechef: {
          handle: HANDLES.codechef,
          rating: rating,
          problemsSolved: solved,
          stars: stars,
          contestsParticipated: contests
        },
        __chart: {
          codechef: {
            rating: rating,
            problemsSolved: solved,
            contests: contests,
            stars: stars
          }
        }
      };
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

  function dispatchLiveData(payload) {
    if (!payload) return;
    window.CP_LIVE_DATA = mergeDeep(window.CP_LIVE_DATA || {}, payload);
    document.dispatchEvent(new CustomEvent('cp-live-data', { detail: window.CP_LIVE_DATA }));
  }

  function dispatchStatus(state) {
    document.dispatchEvent(new CustomEvent('cp-live-status', { detail: { state: state } }));
  }

  var isRefreshing = false;

  function runLiveUpdate() {
    if (isRefreshing) return;
    isRefreshing = true;
    dispatchStatus('loading');
    var tasks = [
      fetchCodeforces(),
      fetchLeetCode(),
      fetchHackerRank(),
      fetchCodeChef()
    ];
    var completed = 0;
    var anySuccess = false;

    tasks.forEach(function (taskPromise) {
      Promise.resolve(taskPromise).then(function (value) {
        if (!value) return;
        anySuccess = true;
        value.fetchedAt = new Date().toISOString();
        dispatchLiveData(value);
        dispatchStatus('ok');
      }).catch(function () {
        // ignore individual failure
      }).finally(function () {
        completed += 1;
        if (completed === tasks.length) {
          if (!anySuccess) {
            dispatchStatus('error');
          }
          isRefreshing = false;
        }
      });
    });
  }

  function wireRefreshButtons() {
    document.querySelectorAll('[data-cp-refresh]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        runLiveUpdate();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      wireRefreshButtons();
      runLiveUpdate();
    });
  } else {
    wireRefreshButtons();
    runLiveUpdate();
  }

  // Refresh periodically while page is open (1 minute).
  setInterval(runLiveUpdate, 60 * 1000);

  // Optional manual trigger from console/button integrations.
  window.refreshCPData = runLiveUpdate;
})();

