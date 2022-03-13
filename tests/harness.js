'use strict'
import chai from 'chai'
import dirtyChai from 'dirty-chai'

process.env.NODE_ENV = 'test'

chai.use(dirtyChai)

export const expect = chai.expect
