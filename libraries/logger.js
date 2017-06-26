'use strict'

const console = {
  debug: msg => {
    console.log(msg)
  },
  info: msg => {
    console.info(msg)
  },
  warn: msg => {
    console.warn(msg)
  },
  error: msg => {
    console.error(msg)
  }
}

const nolog = () => {}
const dummy = {
  debug: nolog,
  info: nolog,
  warn: nolog,
  error: nolog
}

module.exports = {
  console,
  dummy
}
