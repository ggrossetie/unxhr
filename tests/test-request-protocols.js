'use strict'

import ospath from 'path'
import { fileURLToPath } from 'url'

import { expect } from './harness.js'
import { XMLHttpRequest } from '../lib/index.js'

const __dirname = ospath.dirname(fileURLToPath(import.meta.url))

describe('XMLHttpRequest protocols', () => {
  const url = `file://${ospath.join(__dirname, 'text.txt')}`
  it('should get the resource asynchronously from the file:// protocol', async () => {
    const result = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', url)
      xhr.onload = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200 || xhr.status === 0) {
            resolve(xhr.responseText)
          } else {
            reject(new Error(`Invalid status ${xhr.statusText}`))
          }
        }
      }
      xhr.onerror = function (e) {
        reject(new Error(e))
      }
      xhr.send()
    })
    expect(result).to.equal('Hello World')
  })
  it('should get the resource synchronously from the file:// protocol', async () => {
    let result = ''
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, false)
    xhr.onload = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) {
          result = xhr.responseText
        } else {
          throw new Error(`Invalid status ${xhr.statusText}`)
        }
      }
    }
    xhr.onerror = function (e) {
      throw new Error(e)
    }
    xhr.send()
    expect(result).to.equal('Hello World')
  })
})
