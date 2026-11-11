'use strict'

// Symmetric encryption of strings with a password.
//
// Two formats:
// - legacy (no prefix): what crypto.createCipher wrote (removed in Node 22). The key and IV are
//   derived from the password with OpenSSL EVP_BytesToKey (MD5, one iteration, no salt) and the
//   output is hex. It is reproduced here with createCipheriv, byte for byte. The IV is the same for
//   every value (in CTR mode that reuses the keystream), so prefer v2 for new data.
// - v2: `v2:<iv>:<tag>:<ciphertext>` in base64, AES-256-GCM with a random IV per value and the key
//   derived from the password with scrypt. Authenticated: a wrong key fails instead of returning
//   garbage.
//
// decrypt reads both. encrypt writes legacy (as this utility always did) unless options.format is
// 'v2': an app still on an older irie-utils cannot read v2, so switch once every reader is updated.
//
// Options:
// - format: 'v2' to write v2; anything else writes legacy
// - salt: the scrypt salt of v2 (default 'irie-utils-crypto-v2'); the same on every app sharing data
// - previousPassword / previousAlgorithm: the ones being rotated out. v2 is read with either key and
//   legacy is read AND written with the previous one, so an app that still has only the old password
//   reads what the other writes. Once everything is v2 with the new key (re-encrypt with encryptV2),
//   remove the previous password.

const crypto = require('crypto')

const V2_PREFIX = 'v2:'
const V2_ALGORITHM = 'aes-256-gcm'
const V2_IV_LENGTH = 12
const V2_DEFAULT_SALT = 'irie-utils-crypto-v2'

// OpenSSL EVP_BytesToKey with MD5, one iteration and no salt: what crypto.createCipher used
function deriveLegacyKeyAndIv (password, keyLength, ivLength) {
  const pass = Buffer.from(password, 'utf8')
  const blocks = []
  let prev = Buffer.alloc(0)
  let total = 0
  while (total < keyLength + ivLength) {
    prev = crypto.createHash('md5').update(Buffer.concat([prev, pass])).digest()
    blocks.push(prev)
    total += prev.length
  }
  const bytes = Buffer.concat(blocks)
  return {
    key: bytes.subarray(0, keyLength),
    iv: bytes.subarray(keyLength, keyLength + ivLength)
  }
}

function legacyCipher (algorithm, password) {
  password = password || ''
  const info = crypto.getCipherInfo(algorithm)
  if (!info) {
    throw new Error('Unsupported cipher algorithm: ' + algorithm)
  }
  const derived = deriveLegacyKeyAndIv(password, info.keyLength, info.ivLength || 0)
  const iv = info.ivLength ? derived.iv : null

  return {
    encrypt (text) {
      const cipher = crypto.createCipheriv(algorithm, derived.key, iv)
      return cipher.update(text, 'utf8', 'hex') + cipher.final('hex')
    },
    decrypt (text) {
      const decipher = crypto.createDecipheriv(algorithm, derived.key, iv)
      return decipher.update(text, 'hex', 'utf8') + decipher.final('utf8')
    }
  }
}

function v2Key (password, salt) {
  return crypto.scryptSync(password, salt, 32)
}

function v2Encrypt (key, text) {
  const iv = crypto.randomBytes(V2_IV_LENGTH)
  const cipher = crypto.createCipheriv(V2_ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return V2_PREFIX + [iv, cipher.getAuthTag(), encrypted].map(b => b.toString('base64')).join(':')
}

function v2Decrypt (key, text) {
  const parts = text.slice(V2_PREFIX.length).split(':')
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted value')
  }
  const [iv, tag, encrypted] = parts.map(p => Buffer.from(p, 'base64'))
  const decipher = crypto.createDecipheriv(V2_ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

function isV2 (text) {
  return typeof text === 'string' && text.startsWith(V2_PREFIX)
}

function newCrypto (algorithm, password, options) {
  options = options || {}
  password = password || ''
  const salt = options.salt || V2_DEFAULT_SALT
  const writeV2 = options.format === 'v2'
  const currentKey = v2Key(password, salt)
  const previousKey = options.previousPassword ? v2Key(options.previousPassword, salt) : null
  const legacy = options.previousPassword
    ? legacyCipher(options.previousAlgorithm || algorithm, options.previousPassword)
    : legacyCipher(algorithm, password)

  function encrypt (text) {
    return writeV2 ? v2Encrypt(currentKey, text) : legacy.encrypt(text)
  }

  function decrypt (text) {
    if (!isV2(text)) {
      return legacy.decrypt(text)
    }
    try {
      return v2Decrypt(currentKey, text)
    } catch (err) {
      if (!previousKey) {
        throw err
      }
      return v2Decrypt(previousKey, text)
    }
  }

  // whether a stored value is already v2 with the current key (nothing to encrypt again)
  function isCurrent (text) {
    if (!isV2(text)) {
      return false
    }
    try {
      v2Decrypt(currentKey, text)
      return true
    } catch (err) {
      return false
    }
  }

  // v2 with the current key whatever options.format says: for re-encryption scripts
  function encryptV2 (text) {
    return v2Encrypt(currentKey, text)
  }

  return { encrypt, decrypt, isCurrent, encryptV2 }
}

module.exports = newCrypto
// the legacy format alone, for code and tests that pin what crypto.createCipher wrote
module.exports.legacy = legacyCipher
module.exports.isV2 = isV2
