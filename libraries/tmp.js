'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const fs = require('fs')
const multipipe = require('multipipe')
const streamToPromise = require('stream-to-promise')

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
    const outputStream = fs.createWriteStream(tmpFile.path)
    const unifiedStream = multipipe(inputStream, outputStream)

    return streamToPromise(unifiedStream)
    .then(() => {
      return Promise.resolve(tmpFile) // wrap in bluebird promise
    })
    .catch(err => {
      // remove temp file upon error
      tmpFile.cleaner()
      return Promise.reject(err)
    })
  })
}

function createTempDir (prefix) {
  return tmp.dirAsync({ prefix })
}

module.exports = {
  file: createTempFile,
  fileFromStream: createTempFileFromStream,
  dir: createTempDir
}
