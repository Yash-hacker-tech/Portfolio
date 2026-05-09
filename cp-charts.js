/**
 * Performance charts for CP profile pages (Chart.js).
 * Embed data here; update when you want fresher graphs. Codeforces history matches API snapshot.
 */
(function () {
  var BRAND = { border: 'rgba(37, 99, 235, 0.35)', fill: 'rgba(37, 99, 235, 0.12)', line: '#2563eb' };

  var CP_CHART_DATA = {
    codeforces: {
      /** From codeforces.com/api/user.rating?handle=Yash_hacker_ */
      contestNames: [
        'Round 998 (Div. 3)', 'Round 1000 (Div. 2)', 'Edu R175', 'Round 1009 (Div. 3)', 'Edu R176',
        'Round 1011 (Div. 2)', 'Round 1013 (Div. 3)', 'Round 1020 (Div. 3)', 'Round 1025 (Div. 2)', 'Round 1026 (Div. 2)',
        'Round 1027 (Div. 3)', 'Edu R179', 'Round 1029 (Div. 3)', 'Round 1030 (Div. 2)', 'Round 1031 (Div. 2)',
        'Round 1032 (Div. 3)', 'Round 1034 (Div. 3)', 'Round 1037 (Div. 3)', 'Round 1043 (Div. 3)', 'Round 1047 (Div. 3)',
        'Round 1049 (Div. 2)', 'Edu R185', 'Round 1067 (Div. 2)', 'Round 1087 (Div. 2)'
      ],
      ratings: [426, 665, 853, 968, 1010, 954, 899, 977, 996, 1138, 1136, 1024, 1062, 1026, 1044, 1186, 1179, 1164, 1185, 1190, 1170, 1183, 1147, 1170]
    },
    leetcode: {
      /** Problems by difficulty (from stats API) */
      byDifficulty: { easy: 70, medium: 45, hard: 4 }
    },
    hackerrank: {
      /** Level out of a display max for the bar chart */
      level: 5,
      levelMax: 15
    },
    codechef: {
      /** Snapshot metrics — rating journey has few contests; bar compares key numbers (log scale) */
      rating: 1276,
      problemsSolved: 39,
      contests: 1,
      stars: 1
    }
  };

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

  function destroyIfExists(key) {
    if (window._cpCharts && window._cpCharts[key]) {
      try {
        window._cpCharts[key].destroy();
      } catch (e) {}
      window._cpCharts[key] = null;
    }
  }

  function initCodeforces() {
    var el = document.getElementById('cp-chart-cf');
    if (!el || typeof Chart === 'undefined') return;
    destroyIfExists('cf');
    var d = window.CP_CHART_STATE.codeforces;
    var labels = d.ratings.map(function (_, i) {
      return '#' + (i + 1);
    });
    var ctx = el.getContext('2d');
    window._cpCharts = window._cpCharts || {};
    window._cpCharts.cf = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Rating',
          data: d.ratings,
          borderColor: BRAND.line,
          backgroundColor: BRAND.fill,
          borderWidth: 2,
          fill: true,
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Rating after each rated contest' },
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function (items) {
                var i = items[0].dataIndex;
                return d.contestNames[i] || 'Contest';
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: false, grid: { color: 'rgba(15,23,42,0.06)' } },
          x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45, font: { size: 10 } } }
        }
      }
    });
  }

  function initLeetCode() {
    var el = document.getElementById('cp-chart-lc');
    if (!el || typeof Chart === 'undefined') return;
    destroyIfExists('lc');
    var b = window.CP_CHART_STATE.leetcode.byDifficulty;
    var ctx = el.getContext('2d');
    window._cpCharts = window._cpCharts || {};
    window._cpCharts.lc = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Easy', 'Medium', 'Hard'],
        datasets: [{
          data: [b.easy, b.medium, b.hard],
          backgroundColor: ['#22c55e', '#f97316', '#ef4444'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Problems solved by difficulty' },
          legend: { position: 'bottom' }
        }
      }
    });
  }

  function initHackerRank() {
    var el = document.getElementById('cp-chart-hr');
    if (!el || typeof Chart === 'undefined') return;
    destroyIfExists('hr');
    var h = window.CP_CHART_STATE.hackerrank;
    var ctx = el.getContext('2d');
    window._cpCharts = window._cpCharts || {};
    window._cpCharts.hr = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Profile level'],
        datasets: [{
          label: 'Level',
          data: [h.level],
          backgroundColor: 'rgba(37, 99, 235, 0.75)',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          title: { display: true, text: 'HackerRank profile level (max ' + h.levelMax + ')' },
          legend: { display: false }
        },
        scales: {
          x: { min: 0, max: h.levelMax, grid: { color: 'rgba(15,23,42,0.06)' } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  function initCodeChef() {
    var el = document.getElementById('cp-chart-cc');
    if (!el || typeof Chart === 'undefined') return;
    destroyIfExists('cc');
    var c = window.CP_CHART_STATE.codechef;
    var ctx = el.getContext('2d');
    window._cpCharts = window._cpCharts || {};
    window._cpCharts.cc = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Rating', 'Problems solved', 'Rated contests'],
        datasets: [{
          label: 'Snapshot',
          data: [c.rating, c.problemsSolved, c.contests],
          backgroundColor: [
            'rgba(37, 99, 235, 0.85)',
            'rgba(16, 185, 129, 0.85)',
            'rgba(245, 158, 11, 0.85)'
          ],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Profile snapshot (log scale — stars are in the summary above)' },
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var i = ctx.dataIndex;
                if (i === 0) return 'Rating: ' + c.rating;
                if (i === 1) return 'Problems solved: ' + c.problemsSolved;
                if (i === 2) return 'Contests: ' + c.contests;
                return ctx.raw;
              }
            }
          }
        },
        scales: {
          y: {
            type: 'logarithmic',
            min: 1,
            grid: { color: 'rgba(15,23,42,0.06)' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  function run() {
    var page = document.body.getAttribute('data-cp-page');
    if (!page) return;
    if (page === 'codeforces') initCodeforces();
    else if (page === 'leetcode') initLeetCode();
    else if (page === 'hackerrank') initHackerRank();
    else if (page === 'codechef') initCodeChef();
  }

  function applyLiveChartData(liveData) {
    if (!liveData) return;
    var patch = {};
    if (liveData.__chart) {
      patch = mergeDeep(patch, liveData.__chart);
    }
    if (liveData.leetcode) {
      patch.leetcode = patch.leetcode || {};
      patch.leetcode.byDifficulty = {
        easy: liveData.leetcode.easySolved,
        medium: liveData.leetcode.mediumSolved,
        hard: liveData.leetcode.hardSolved
      };
    }
    if (liveData.hackerrank && typeof liveData.hackerrank.level === 'number') {
      patch.hackerrank = patch.hackerrank || {};
      patch.hackerrank.level = liveData.hackerrank.level;
    }
    if (liveData.codechef) {
      patch.codechef = patch.codechef || {};
      if (typeof liveData.codechef.rating === 'number') patch.codechef.rating = liveData.codechef.rating;
      if (typeof liveData.codechef.problemsSolved === 'number') patch.codechef.problemsSolved = liveData.codechef.problemsSolved;
      if (typeof liveData.codechef.contestsParticipated === 'number') patch.codechef.contests = liveData.codechef.contestsParticipated;
      if (typeof liveData.codechef.stars === 'number') patch.codechef.stars = liveData.codechef.stars;
    }
    window.CP_CHART_STATE = mergeDeep(window.CP_CHART_STATE, patch);
    run();
  }

  window.CP_CHART_STATE = mergeDeep({}, CP_CHART_DATA);
  window.applyCPChartData = applyLiveChartData;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  document.addEventListener('cp-live-data', function (ev) {
    applyLiveChartData(ev && ev.detail ? ev.detail : null);
  });
})();
