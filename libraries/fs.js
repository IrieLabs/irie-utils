'use strict'

const readHugeFile = require('./read-huge-file')
const tmp = require('./tmp')

module.exports = {
  readHugeFile,
  tmpFile: tmp.file,
  tmpFileFromStream: tmp.fileFromStream,
  countFileLines: (filePath, discardEmpties) => {
    return readHugeFile(filePath, undefined, { discardEmpties })
  }
}
