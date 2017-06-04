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
    lineProcessor = () => resolvedPromise
  }

  return new Promise((resolve, reject) => {
    // based on http://stackoverflow.com/a/23695940
    const summary = {
      lines: 0,
      empties: 0
    }
    const s = fs.createReadStream(filePath)
      .pipe(es.split())
      .pipe(es.mapSync(line => {
        // pause the readstream
        s.pause()
        summary.lines += 1

        if (!options.startAfterLine || summary.lines > options.startAfterLine) {
          if (!line) {
            summary.empties += 1
            if (options.discardEmpties) {
              s.resume()
              return
            }
          }
          // process line here and call s.resume() when rdy
          // function below was for logging memory usage
          lineProcessor(summary.lines, line)
          .then(() => {
            // resume the readstream
            s.resume()
          })
          .catch(err => {
            s.end()
            reject(err)
          })
        } else if (summary.lines === options.startAfterLine) {
          options.logger('Last line skipped: #' + summary.lines, line)
          s.resume()
        } else {
          s.resume()
        }
      })
      .on('error', err => {
        reject(err)
      })
      .on('end', () => {
        resolve(summary)
      })
    )
  })
}

module.exports = readHugeFile
