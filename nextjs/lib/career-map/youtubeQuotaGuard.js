// In-memory daily quota tracker for YouTube Data API v3.
// Resets on server restart — good enough for daily tracking since the
// daily quota itself resets at midnight Pacific time.

const DAILY_QUOTA   = 10_000;
const SEARCH_COST   = 101;   // search.list (100) + videos.list (1)
const SAFETY_BUFFER = 500;   // reserve for other YouTube API calls

let usedToday    = 0;
let lastResetDay = new Date().toDateString();

function resetIfNewDay() {
  const today = new Date().toDateString();
  if (today !== lastResetDay) {
    usedToday    = 0;
    lastResetDay = today;
  }
}

export function canMakeVideoSearch() {
  resetIfNewDay();
  return (usedToday + SEARCH_COST) <= (DAILY_QUOTA - SAFETY_BUFFER);
}

export function recordVideoSearch() {
  resetIfNewDay();
  usedToday += SEARCH_COST;
}

export function getQuotaStatus() {
  resetIfNewDay();
  return {
    used:      usedToday,
    remaining: DAILY_QUOTA - usedToday,
    canSearch: canMakeVideoSearch(),
  };
}
