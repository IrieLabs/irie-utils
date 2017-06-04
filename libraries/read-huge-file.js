'use strict'

const fs = require('fs')
const es = require('event-stream')
const Promise = require('bluebird')

function readHugeFile (filePath, lineProcessor, options) {
  options = options || {}
  options.logger = options.logger || function noLog () {}

  // dummy line processor, useful for counting lines only
  if (!lineProcessor) {
    const resolvedPromise = Promise.resolve()
    lineProcessor = () => {
      return resolvedPromise
    }
  }

  return new Promise(function (resolve, reject) {
    // based on http://stackoverflow.com/a/23695940
    let lineNr = 0
    const s = fs.createReadStream(filePath)
      .pipe(es.split())
      .pipe(es.mapSync(function (line) {
        // pause the readstream
        s.pause()
        lineNr += 1

        if (!options.startAfterLine || lineNr > options.startAfterLine) {
          // process line here and call s.resume() when rdy
          // function below was for logging memory usage
          lineProcessor(lineNr, line)
          .then(() => {
            // resume the readstream
            s.resume()
          })
          .catch(err => {
            s.end()
            reject(err)
          })
        } else if (lineNr === options.startAfterLine) {
          options.logger('Last line skipped: #' + lineNr, line)
          s.resume()
        } else {
          s.resume()
        }
      })
      .on('error', err => {
        reject(err)
      })
      .on('end', () => {
        resolve(lineNr)
      })
    )
  })
}

module.exports = readHugeFile
