

export function twoPad(s, len, ch) {
  len = len || 2;
  ch = ch || '0';

  s = s + '';
  while (s.length < len) {
    s = ch + s;
  }
  return s;
}

export function timeSinceMidnight(date) {
  if (!date) return '';
  if (typeof date == 'string' || typeof date == 'number') {
    date = new Date(date);
  }

  return date.getHours() * 3600000 +
    date.getMinutes() * 60000 +
    date.getSeconds() * 1000 +
    date.getMilliseconds();
}

export function formatDate(date) {
  if (!date) return '';
  if (typeof date == 'string' || typeof date == 'number') {
    date = new Date(date);
  }
  return twoPad(date.getDate()) + '-' +
            twoPad(date.getMonth() + 1) + '-' +
            twoPad(date.getFullYear());
}

export function formatDateMMMdd(date) {
  var monthNames = 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(',');

  if (!date) return '';
  if (typeof date == 'string' || typeof date == 'number') {
    date = new Date(date);
  }
  return monthNames[date.getMonth()] + ' ' + twoPad(date.getDate());
}

export function formatUTCDate(date) {
  if (!date) return '';
  if (typeof date == 'string') {
    date = new Date(date);
  }
  return twoPad(date.getUTCDate()) + '-' +
            twoPad(date.getUTCMonth() + 1) + '-' +
            twoPad(date.getUTCFullYear());
}

export function formatTime(date, prePadding) {
  if (!date) return '';
  if (typeof date == 'string' || typeof date == 'number') {
    date = new Date(date);
  }

  var hours = date.getHours();

  var hourPart = 12 - (24 - hours) % 12;
  hourPart = prePadding ? twoPad(hourPart, 2, '\u2007') : hourPart;

    /* \u2007 is a figure space */
  return hourPart + ':' +
            twoPad(date.getMinutes()) + '\u00a0' /* non-breaking space */
            + (hours > 12 ? 'pm' : 'am')/* + ':' +
            twoPad(date.getSeconds()) */;
}

// func to generate something like '14:15 pm' from JS date obj
export function formatHHMM_ampm(t) {
  var h = t.getHours(),
    m = t.getMinutes(),
    term = 'am';

  if (h >= 12)
  {
    term = 'pm';
    if (h > 12) { h = h - 12; }
    h = h.toString();
  }

  if (h.toString().length == 1) { h = '0' + h.toString(); }
  if (m.toString().length == 1) { m = '0' + m.toString(); }

  return h + ':' + m + ' ' + term;
}

export function titleCase(s) {
  if (!s) return '';

  return s.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}
