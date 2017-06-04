'use strict'

const readHugeFile = require('./read-huge-file')
const tmp = require('./tmp')

module.exports = {
  readHugeFile,
  tmpFile: tmp.file,
  countFileLines: filePath => {
    return readHugeFile(filePath)
  }
}
