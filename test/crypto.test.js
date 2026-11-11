'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert')
const newCrypto = require('../libraries/crypto')

// crypto.createCipher('aes-256-ctr', 'apesa-test') of 'certificado de prueba', made on Node 16
const ENCRYPTED_BY_CREATE_CIPHER = '477d66059578f5508ebd1943db516c47b5a5bc8ec8'

describe('crypto', () => {
  describe('legacy format', () => {
    const legacy = newCrypto.legacy('aes-256-ctr', 'apesa-test')

    it('reads what crypto.createCipher encrypted', () => {
      assert.strictEqual(legacy.decrypt(ENCRYPTED_BY_CREATE_CIPHER), 'certificado de prueba')
    })

    it('encrypts as crypto.createCipher did', () => {
      assert.strictEqual(legacy.encrypt('certificado de prueba'), ENCRYPTED_BY_CREATE_CIPHER)
    })

    it('round-trips with a block cipher (aes256 = aes-256-cbc)', () => {
      const cbc = newCrypto.legacy('aes256', 'pass')
      assert.strictEqual(cbc.decrypt(cbc.encrypt('pem')), 'pem')
    })

    it('rejects an unknown algorithm', () => {
      assert.throws(() => newCrypto.legacy('nope', 'pass'), /Unsupported cipher algorithm/)
    })
  })

  describe('default format (legacy, as before)', () => {
    const crypto = newCrypto('aes-256-ctr', 'apesa-test')

    it('writes exactly what crypto.createCipher wrote', () => {
      assert.strictEqual(crypto.encrypt('certificado de prueba'), ENCRYPTED_BY_CREATE_CIPHER)
    })

    it('reads legacy and v2', () => {
      assert.strictEqual(crypto.decrypt(ENCRYPTED_BY_CREATE_CIPHER), 'certificado de prueba')
      assert.strictEqual(crypto.decrypt(crypto.encryptV2('x')), 'x')
    })
  })

  describe("format 'v2'", () => {
    const crypto = newCrypto('aes-256-ctr', 'apesa-test', { format: 'v2' })

    it('writes v2 with a different IV every time', () => {
      const first = crypto.encrypt('certificado de prueba')
      const second = crypto.encrypt('certificado de prueba')
      assert.match(first, /^v2:/)
      assert.notStrictEqual(first, second)
      assert.strictEqual(crypto.decrypt(first), 'certificado de prueba')
      assert.strictEqual(crypto.decrypt(second), 'certificado de prueba')
    })

    it('still reads legacy values', () => {
      assert.strictEqual(crypto.decrypt(ENCRYPTED_BY_CREATE_CIPHER), 'certificado de prueba')
    })

    it('tells the values that are v2 with the current password', () => {
      assert.strictEqual(crypto.isCurrent(crypto.encrypt('x')), true)
      assert.strictEqual(crypto.isCurrent(ENCRYPTED_BY_CREATE_CIPHER), false)
      assert.strictEqual(crypto.isCurrent(newCrypto('aes-256-ctr', 'other').encryptV2('x')), false)
    })

    it('fails with another password instead of returning garbage', () => {
      const encrypted = newCrypto('aes-256-ctr', 'other').encryptV2('x')
      assert.throws(() => crypto.decrypt(encrypted))
    })

    it('fails with another salt', () => {
      const encrypted = newCrypto('aes-256-ctr', 'apesa-test', { salt: 'other-salt' }).encryptV2('x')
      assert.throws(() => crypto.decrypt(encrypted))
    })
  })

  describe('while rotating the password', () => {
    const before = newCrypto('aes-256-ctr', 'apesa-test')
    const rotating = newCrypto('aes-256-ctr', 'new-password', { previousPassword: 'apesa-test' })

    it('reads and writes legacy with the previous password', () => {
      assert.strictEqual(rotating.decrypt(ENCRYPTED_BY_CREATE_CIPHER), 'certificado de prueba')
      assert.strictEqual(rotating.encrypt('certificado de prueba'), ENCRYPTED_BY_CREATE_CIPHER)
    })

    it('reads the v2 values of either password', () => {
      assert.strictEqual(rotating.decrypt(before.encryptV2('ticket')), 'ticket')
      assert.strictEqual(rotating.decrypt(rotating.encryptV2('ticket')), 'ticket')
    })

    it('writes v2 with the new password only', () => {
      const encrypted = rotating.encryptV2('clave')
      assert.strictEqual(newCrypto('aes-256-ctr', 'new-password').decrypt(encrypted), 'clave')
      assert.throws(() => before.decrypt(encrypted))
      assert.strictEqual(rotating.isCurrent(encrypted), true)
      assert.strictEqual(rotating.isCurrent(before.encryptV2('clave')), false)
    })

    it('reads legacy values of another algorithm when the previous one changes', () => {
      const cbc = newCrypto.legacy('aes256', 'old').encrypt('pem')
      const crypto = newCrypto('aes-256-ctr', 'new-password', { previousPassword: 'old', previousAlgorithm: 'aes256' })
      assert.strictEqual(crypto.decrypt(cbc), 'pem')
    })
  })
})
