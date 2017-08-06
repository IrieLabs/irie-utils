'use strict'

const console = {
  debug: (...params) => {
    console.log(...params)
  },
  info: (...params) => {
    console.info(...params)
  },
  warn: (...params) => {
    console.warn(...params)
  },
  error: (...params) => {
    console.error(...params)
  },
  critical: (...params) => {
    console.error(...params)
  }
}

const nolog = () => {}
const dummy = {
  debug: nolog,
  info: nolog,
  warn: nolog,
  error: nolog,
  critical: nolog
}

function newRollbar (accessToken, environment) {
  // configure rollbar
  const Rollbar = require('rollbar')
  const rollbar = new Rollbar({
    accessToken,
    environment,
    captureUncaught: true,
    captureUnhandledRejections: true,
    // Call process.exit(1) when an uncaught exception occurs but after reporting all
    // pending errors to Rollbar.
    exitOnUncaughtException: true,
    scrubHeaders: ['Authorization']
  })

  return {
    debug: rollbar.debug.bind(rollbar),
    info: rollbar.info.bind(rollbar),
    warn: rollbar.warning.bind(rollbar),
    error: rollbar.error.bind(rollbar),
    critical: rollbar.critical.bind(rollbar)
  }
}

module.exports = {
  console,
  dummy,
  newRollbar
}
