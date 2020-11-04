'use strict'

const ospath = require('path')
const childProcess = require('child_process')
const fs = require('fs')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
chai.use(dirtyChai)
const expect = chai.expect
const XMLHttpRequest = require('../lib/XMLHttpRequest').XMLHttpRequest

;[true, false].forEach((ssl) => {
  const protocol = ssl ? 'https' : 'http'
  const serverArgs = ssl ? ['--ssl'] : []
  ;[true, false].forEach((asyncReq) => {
    describe(`XMLHttpRequest ${asyncReq ? 'asynchronous' : 'synchronous'} request over ${protocol}`, () => {
      const serverScriptPath = ospath.join(__dirname, 'server.js')
      it(`should get resource ${asyncReq ? 'asynchronously' : 'synchronously'}`, async () => {
        const child = childProcess.fork(serverScriptPath, serverArgs)
        try {
          let data = ''
          await new Promise((resolve) => {
            child.on('message', message => {
              if (message && message.port) {
                const xhr = new XMLHttpRequest()
                xhr.open('GET', `${protocol}://localhost:${message.port}`, asyncReq, null, null, false)
                xhr.onload = function () {
                  if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                      data = xhr.responseText
                    }
                    resolve()
                  }
                }
                xhr.send()
              }
            })
          })
          expect(data).to.equal('Hello World')
        } finally {
          child.kill()
        }
      })
      it(`should get image ${asyncReq ? 'asynchronously' : 'synchronously'}`, async () => {
        const child = childProcess.fork(serverScriptPath, serverArgs)
        try {
          let response
          await new Promise((resolve) => {
            child.on('message', async message => {
              if (message && message.port) {
                const xhr = new XMLHttpRequest()
                xhr.open('GET', `${protocol}://localhost:${message.port}/cat.png`, asyncReq, null, null, false)
                xhr.responseType = 'arraybuffer'
                xhr.onload = function () {
                  if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                      response = xhr.response
                    }
                    resolve()
                  }
                }
                await xhr.send()
              }
            })
          })
          expect(response instanceof ArrayBuffer).to.equal(true)
          expect(fs.readFileSync(ospath.join(__dirname, 'cat.png')).compare(new Uint8Array(response))).to.equal(0)
        } finally {
          child.kill()
        }
      })
      it(`should post data ${asyncReq ? 'asynchronously' : 'synchronously'}`, async () => {
        const child = childProcess.fork(serverScriptPath, serverArgs)
        try {
          let responseText = ''
          await new Promise((resolve) => {
            child.on('message', async message => {
              if (message && message.port) {
                const xhr = new XMLHttpRequest()
                xhr.open('POST', `${protocol}://localhost:${message.port}/echo`, asyncReq, null, null, false)
                xhr.onload = function () {
                  if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                      responseText = xhr.responseText
                    }
                    resolve()
                  }
                }
                await xhr.send('ping! "from client"')
              }
            })
          })
          expect(responseText).to.equal('ping! "from client"')
        } finally {
          child.kill()
        }
      })
      it(`should post json data ${asyncReq ? 'asynchronously' : 'synchronously'} (with correct content-length)`, async () => {
        const child = childProcess.fork(serverScriptPath, serverArgs)
        try {
          let responseText = ''
          await new Promise((resolve) => {
            child.on('message', async message => {
              if (message && message.port) {
                const xhr = new XMLHttpRequest()
                xhr.open('POST', `${protocol}://localhost:${message.port}/length`, asyncReq, null, null, false)
                xhr.onload = function () {
                  if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                      responseText = xhr.responseText
                    }
                    resolve()
                  }
                }
                xhr.send(' \n{  "message":  "hello" }  \r\n')
              }
            })
          })
          expect(responseText).to.equal('30')
        } finally {
          child.kill()
        }
      })
    })
  })
})

describe('XMLHttpRequest rejectUnauthorized', () => {
  const serverScriptPath = ospath.join(__dirname, 'server.js')
  const serverArgs = ['--ssl']
  ;[true, false].forEach((asyncReq) => {
    it(`XMLHttpRequest rejectUnauthorized true, ${asyncReq ? 'async' : 'sync'}`, async () => {
      const child = childProcess.fork(serverScriptPath, serverArgs)
      try {
        let responseText = ''
        let errorText = ''
        await new Promise((resolve, reject) => {
          child.on('message', async message => {
            if (message && message.port) {
              const xhr = new XMLHttpRequest()
              xhr.open('POST', `https://localhost:${message.port}/echo`, asyncReq)
              xhr.onload = function () {
                if (xhr.readyState === 4) {
                  if (xhr.status === 200) {
                    responseText = xhr.responseText
                  }
                  reject(new Error('request should not succeed'))
                }
              }
              xhr.onerror = function () {
                errorText = xhr.responseText
                resolve()
              }
              await xhr.send('ping! "from client"')
            }
          })
        })
        expect(responseText).to.equal('')
        expect(errorText).to.equal('{"code":"CERT_HAS_EXPIRED"}')
      } finally {
        child.kill()
      }
    })
  })
})
