'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const fs = require('fs')
const { pipeline } = require('stream/promises')

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
  return createTempFile(extension, prefix)
    .then(tmpFile => {
      // pipeline resolves once the file is fully written (and destroys both
      // streams on error)
      return Promise.resolve(pipeline(inputStream, fs.createWriteStream(tmpFile.path)))
        .then(() => tmpFile)
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
