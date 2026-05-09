# Portfolio
This are my details and everything you need to know about me

## Competitive programming stats

Numbers are filled by **`cp-stats.js`** using **`CP_DATA_FALLBACK`** inside that file (so values show even when you open HTML with **double‑click / `file://`**).

- **To update your stats:** edit **`CP_DATA_FALLBACK`** in `cp-stats.js` **and** keep **`cp-data.json`** in sync (same numbers), so Live Server can still override from JSON if you use it.

Snapshot sources (when last filled): Codeforces official API, LeetCode stats API (alfa-leetcode-api), HackerRank REST profile, CodeChef public profile page.

## Performance charts (`cp-charts.js` + Chart.js)

Each CP page (`codeforces.html`, `leetcode.html`, `hackerrank.html`, `codechef.html`) includes a chart powered by **Chart.js** (loaded from CDN).

- **Codeforces:** line chart of **rating after each rated contest** (full history in `CP_CHART_DATA.codeforces` — refresh from the `user.rating` API when you play new contests).
- **LeetCode:** **doughnut** of easy / medium / hard solved — keep in sync with `CP_CHART_DATA.leetcode.byDifficulty` and your `cp-stats.js` numbers.
- **HackerRank:** horizontal **bar** for profile level vs `levelMax`.
- **CodeChef:** **bar** chart (log scale) for rating, problems solved, and contest count.

Requires an internet connection the first time to load Chart.js from the CDN.
