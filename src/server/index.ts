import express, { NextFunction, Request, Response } from 'express'
import 'express-async-errors'

import router from './routes'
import middlewares, { notFoundErrorHandler } from './middlewares'

const app = express()

import config from '../../config.json'
import Server from './Server'
import { dataContract, appContract } from '../eth'

const start = async () => {
  const server = new Server({
    dataContract,
    appContract,
    numOracles: config.numOracles
  })

  try {
    await server.init()
  } catch (e) {
    console.log('server init failure', e)
  }

  const contextHandler = (req: Request, _: Response, next: NextFunction) => {
    req.locals = { dataContract, appContract, server }
    next()
  }

  app.set('json spaces', 2)
  app.use([contextHandler, ...middlewares, router])
  app.listen(3000, () => console.log(`Oracles server 👂 on port 3000`))

  app.all('*', notFoundErrorHandler)
}

try {
  start()
} catch (e) {
  console.log('start up failure', e)
  process.exit(1)
}
