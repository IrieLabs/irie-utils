'use strict'

const crypto = require('crypto')

// TODO: crypto.createCipher/createDecipher were removed in Node 22. Migrating to
// createCipheriv changes the ciphertext format, so it needs its own change.
/* eslint-disable n/no-deprecated-api */

function newCrypto (algorithm, password) {
  // https://github.com/chris-rock/node-crypto-examples
  function encrypt (text) {
    const cipher = crypto.createCipher(algorithm, password)
    let crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex')
    return crypted
  }

  function decrypt (text) {
    const decipher = crypto.createDecipher(algorithm, password)
    let dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8')
    return dec
  }

  return {
    encrypt,
    decrypt
  }
}

module.exports = newCrypto
