const jstFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

export function getJstDateParts(offsetDays = 0) {
  const now = new Date();
  const [year, month, day] = jstFormatter.format(now).split('-').map(Number);
  const base = new Date(Date.UTC(year, month - 1, day + offsetDays));

  return {
    year: base.getUTCFullYear(),
    month: base.getUTCMonth() + 1,
    day: base.getUTCDate(),
    date: base
  };
}

export function formatDateYmd(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}