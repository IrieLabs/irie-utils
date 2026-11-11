'use strict'

const fs = require('fs')
const tmp = require('./tmp')

// Downloads `url` and resolves with its content as a Buffer.
// If `destination` (a directory) is given, the file is also written there,
// named after the last segment of the URL path (or `options.filename`).
async function download (url, destination, options) {
  options = options || {}
  const res = await fetch(url, options.fetch)
  if (!res.ok) {
    const err = new Error(`Response code ${res.status} (${res.statusText})`)
    err.statusCode = res.status
    err.url = url
    throw err
  }
  const data = Buffer.from(await res.arrayBuffer())
  if (destination) {
    const path = require('path')
    const filename = options.filename || path.basename(new URL(url).pathname) || 'download'
    await fs.promises.mkdir(destination, { recursive: true })
    await fs.promises.writeFile(path.join(destination, filename), data)
  }
  return data
}

function tmpFile (url) {
  return tmp.file()
    .then(tmpFile => {
      return download(url)
        .then(data => fs.promises.writeFile(tmpFile.path, data))
        .then(() => tmpFile)
    })
}

module.exports = {
  image: require('./image-downloader'),
  file: download,
  tmpFile
}
