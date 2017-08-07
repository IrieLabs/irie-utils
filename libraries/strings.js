'use strict'

const noDiacritics = require('diacritics').remove
const uuid = require('uuid/v4')
const shortid = require('shortid').generate
const isJSON = require('is-json')

module.exports = {
  uuid,
  noDiacritics,
  shortid,
  uniqueid: shortid,
  isJSON
}
