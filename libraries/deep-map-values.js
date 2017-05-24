'use strict'

// extend lodash with lodash-deep mixins
const _ = require('lodash')
_.mixin(require('lodash-deep'))

module.exports = _.deepMapValues
