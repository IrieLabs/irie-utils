'use strict'

const noDiacritics = require('diacritics').remove
const uuid = require('uuid/v4')
const shortid = require('shortid').generate

function isJSON (value) {
  try {
    return JSON.parse(value) && true
  } catch (ex) {
    return false
  }
}

module.exports = {
  uuid,
  noDiacritics,
  shortid,
  uniqueid: shortid,
  isJSON
}
