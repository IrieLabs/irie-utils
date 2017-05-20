'use strict'

const currencyFormatter = require('currency-formatter')

function format (amount, locale = 'en') {
  return currencyFormatter.format(amount, {
    locale: locale
  })
}

module.exports = {
  format
}
