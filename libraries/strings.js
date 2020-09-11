'use strict'

const noDiacritics = require('diacritics').remove
const uuid = require('uuid/v4')
const shortid = require('shortid').generate
const isJSON = require('is-json')

const ARRAY_PATTERN = /^\[.*\]$/

function isJSONWrapper (value) {
  if (isJSON(value)) {
    return true
  } else if (ARRAY_PATTERN.test(value)) {
    try {
      value = JSON.parse(value)
      return Array.isArray(value)
    } catch (err) {
      // fall through
    }
  }
  return false
}

module.exports = {
  uuid,
  noDiacritics,
  shortid,
  uniqueid: shortid,
  isJSON: isJSONWrapper
}
