import cors from 'cors'
import express from 'express'

export default [cors(), express.json()]

export { default as notFoundErrorHandler } from './not-found'
