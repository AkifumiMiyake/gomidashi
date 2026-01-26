const weekdayMap: Record<string, number> = {
  日: 0,
  月: 1,
  火: 2,
  水: 3,
  木: 4,
  金: 5,
  土: 6
};

const weekdayChars = Object.keys(weekdayMap).join('');
const weeklyRegex = new RegExp(`^[${weekdayChars}]$`);
const nthWeekdayRegex = new RegExp(`^第?([1-5])週?([${weekdayChars}])$`);
const compactNthRegex = new RegExp(`^([1-5])([${weekdayChars}])$`);
const dottedRegex = new RegExp(`^([1-5](?:\\.[1-5])+)([${weekdayChars}])$`);

export type GarbageRuleRecord = {
  burnable_rule: string | null;
  resource_rule: string | null;
  landfill_rule: string | null;
  extra_rule: string | null;
};

export function getPickupsForDate(record: GarbageRuleRecord, targetDate: Date) {
  const checks: Array<{ label: string; rule: string | null }> = [
    { label: '可燃ごみ', rule: record.burnable_rule },
    { label: '不燃ごみ', rule: record.landfill_rule },
    { label: '資源化物', rule: record.resource_rule },
    { label: 'プラスチック資源', rule: record.extra_rule }
  ];

  return checks
    .filter(({ rule }) => ruleMatches(rule ?? '', targetDate))
    .map(({ label }) => label);
}

function normalizeRule(rule: string) {
  const half = toHalfWidth(rule);

  return half
    .replace(/[\s　]+/g, '')
    .replace(/毎週/g, '')
    .trim();
}

function toHalfWidth(str: string) {
  return str
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/．/g, '.');
}

function ruleMatches(rule: string, targetDate: Date) {
  if (!rule) return false;
  if (/[な無]し/.test(rule)) return false;

  const normalized = normalizeRule(rule);
  if (!normalized) return false;

  const parts = normalized.split('・').filter(Boolean);
  return parts.some((part) => partMatches(part, targetDate));
}

function partMatches(part: string, targetDate: Date) {
  const weekday = targetDate.getDay();
  const nthOfWeekday = getNthOfWeekdayInMonth(targetDate);

  if (weeklyRegex.test(part)) {
    return weekdayMap[part] === weekday;
  }

  const nthWeekday = part.match(nthWeekdayRegex) || part.match(compactNthRegex);
  if (nthWeekday) {
    const nth = Number(nthWeekday[1]);
    const weekdayChar = nthWeekday[2];
    return weekdayMap[weekdayChar] === weekday && nthOfWeekday === nth;
  }

  const dotted = part.match(dottedRegex);
  if (dotted) {
    const nthList = dotted[1].split('.').map(Number);
    const weekdayChar = dotted[2];
    return weekdayMap[weekdayChar] === weekday && nthList.includes(nthOfWeekday);
  }

  return false;
}

// テストケース:
// 2026-01-06（火） → nth = 1
// 2026-01-13（火） → nth = 2
// 2026-01-20（火） → nth = 3
// 2026-01-27（火） → nth = 4
function getNthOfWeekdayInMonth(date: Date): number {
  const targetDay = date.getDay();
  let count = 0;

  for (let d = 1; d <= date.getDate(); d += 1) {
    const tmp = new Date(date.getFullYear(), date.getMonth(), d);
    if (tmp.getDay() === targetDay) {
      count += 1;
    }
  }

  return count;
}
