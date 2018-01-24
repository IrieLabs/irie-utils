'use strict'

'use strict'

const moment = require('moment')

function between (v, min, max) {
  return v == null ? false : v >= min && v <= max
}

function isValidDate (v) {
  if (!v || !v.year || !between(v.month, 0, 11) || !v.date) {
    return false
  }
  const d = moment([v.year, v.month, v.date])
  return d.isValid() && d.date() === v.date && d.month() === v.month && d.year() === v.year
}

function isValidTime (v) {
  return !!v && between(v.hour, 0, 59) && between(v.minutes, 0, 59)
}

function isToday (v, timezone) {
  const today = toMoment(null, null, timezone)

  return v.year === today.year() && v.month === today.month() && v.date === today.date()
}

function isPast (v, timezone) {
  const today = toMoment(null, null, timezone)

  if (v.year > today.year()) {
    return false
  } else if (v.year === today.year()) {
    if (v.month > today.month()) {
      return false
    } else if (v.month === today.month() && v.date >= today.date()) {
      return false
    }
  }
  return true
}

function isPastOrToday (v, timezone) {
  const today = toMoment(null, null, timezone)

  if (v.year > today.year()) {
    return false
  } else if (v.year === today.year()) {
    if (v.month > today.month()) {
      return false
    } else if (v.month === today.month() && v.date > today.date()) {
      return false
    }
  }
  return true
}

function isFuture (v, timezone) {
  const today = toMoment(null, null, timezone)

  if (v.year < today.year()) {
    return false
  } else if (v.year === today.year()) {
    if (v.month < today.month()) {
      return false
    } else if (v.month === today.month() && v.date <= today.date()) {
      return false
    }
  }
  return true
}

function isFutureOrToday (v, timezone) {
  const today = toMoment(null, null, timezone)

  if (v.year < today.year()) {
    return false
  } else if (v.year === today.year()) {
    if (v.month < today.month()) {
      return false
    } else if (v.month === today.month() && v.date < today.date()) {
      return false
    }
  }
  return true
}

function toMoment (date, time, timezone) {
  if (date && typeof date.toObject === 'function') {
    date = date.toObject()
  }
  if (time && typeof time.toObject === 'function') {
    time = time.toObject()
  }

  const timestamp = timezone ? moment().tz(timezone) : moment()
  if (date) {
    timestamp.date(date.date)
    timestamp.month(date.month)
    timestamp.year(date.year)
  }
  if (time) {
    timestamp.hour(time.hour)
    timestamp.minutes(time.minutes)
  }
  return timestamp
}

function toDateOnly (date) {
  return {
    year: date.year(),
    month: date.month(),
    date: date.date()
  }
}

function toTimeOnly (time) {
  return {
    hour: time.hour(),
    minutes: time.minutes()
  }
}

function toDateValue (d, t) {
  t = t || {}
  t.hour = t.hour || 0
  t.minutes = t.minutes || 0
  return (d.year * 100000000) + (d.month * 1000000) + (d.date * 10000) + (t.hour * 100) + t.minutes
}

function toTimestampValue (d, t, timezone) {
  const date = toMoment(d, t, timezone)
  return date.valueOf()
}

module.exports = {
  isValidDate,
  isValidTime,

  isToday,
  isPast,
  isPastOrToday,
  isFuture,
  isFutureOrToday,

  toMoment,
  toDateOnly,
  toTimeOnly,
  toDateValue,
  toTimestampValue
}