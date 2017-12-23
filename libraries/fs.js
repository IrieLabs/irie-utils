'use strict'

const readHugeFile = require('./read-huge-file')
const tmp = require('./tmp')
const sanitize = require('sanitize-filename')

module.exports = {
  readHugeFile,
  tmpFile: tmp.file,
  tmpFileFromStream: tmp.fileFromStream,
  sanitize,
  countFileLines: (filePath, discardEmpties) => {
    return readHugeFile(filePath, undefined, { discardEmpties })
  }
}
