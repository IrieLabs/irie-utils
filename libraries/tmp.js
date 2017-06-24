'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const fs = require('fs')

const promisificationOptions = {
  multiArgs: true,
  filter: function promisificationSyncFilter (name) {
    return !_.endsWith(name, 'Sync')
  }
}
const tmp = Promise.promisifyAll(require('tmp'), promisificationOptions)

function createTempFile (extension, prefix) {
  return tmp.fileAsync({
    prefix: prefix || 'tmp-',
    postfix: '.' + (extension || 'tmp')
  })
  .spread((path, fd, cleaner) => {
    return { path, fd, cleaner }
  })
}

function createTempFileFromStream (inputStream, extension, prefix) {
  return createTempFile()
  .then(tmpFile => {
    return new Promise((resolve, reject) => {
      const outputStream = fs.createWriteStream(tmpFile.path).on('error', reject).on('finish', resolve)
      inputStream.pipe(outputStream)
    })
    .then(() => tmpFile)
    .catch(err => {
      // remove temp file upon error
      tmpFile.cleaner()
      return Promise.reject(err)
    })
  })
}

module.exports = {
  file: createTempFile,
  fileFromStream: createTempFileFromStream
}
