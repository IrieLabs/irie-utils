'use strict'

// based on http://stackoverflow.com/a/17133012/2115580
//
// another alternative
// https://github.com/mazira/base64-stream
// https://github.com/bendrucker/stream-to-promise
// https://www.npmjs.com/package/pipe-streams-to-promise

// const base64 = require('base64-stream');

const _ = require('lodash')
const Promise = require('bluebird')
const NodeCache = require('node-cache')

module.exports = function buildImageDownloader (options) {
  options = _.defaults(options || {}, {
    stdTTL: 60 * 60 * 24, // one day
    checkperiod: 60 * 60 // check every hour
  })

  // Configure cache for images
  const IMAGES_CACHE = new NodeCache({
    stdTTL: options.stdTTL,
    checkperiod: options.checkperiod,
    useClones: false // no need the overhead of cloning
  })
  IMAGES_CACHE.on('del', function (key) {
    console.info('IMAGES CACHE: removing file:', key)
  })
  process.on('exit', function (code) {
    console.info('IMAGES CACHE: closing before exiting:', code)
    IMAGES_CACHE.close()
  })

  return function imageDownloader (imgUrl, options) {
    // defaults
    options = options || {}
    options.asBuffer = options.asBuffer || false

    // cache short circuit
    const cacheKey = imgUrl + '|\\|' + options.asBuffer
    let image = IMAGES_CACHE.get(cacheKey)
    if (image) {
      return Promise.resolve(image)
    }

    return Promise.resolve(fetch(imgUrl))
      .then(res => Promise.all([res, res.arrayBuffer()]))
      .spread((res, body) => {
        let content = Buffer.from(body)
        if (!options.asBuffer) {
          content = content.toString('base64')
        }

        image = {
          type: res.headers.get('content-type'),
          content
        }
        IMAGES_CACHE.set(cacheKey, image)
        return image
      })
  }
}
