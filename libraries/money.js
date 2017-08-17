'use strict'

const currencyFormatter = require('currency-formatter')

// tools to consider
// https://osrec.github.io/currencyFormatter.js/

function format (amount, code) {
  return currencyFormatter.format(amount, { code })
}

function formatByLocale (amount, locale = 'en') {
  return currencyFormatter.format(amount, { locale })
}

module.exports = {
  format,
  formatByLocale
}
