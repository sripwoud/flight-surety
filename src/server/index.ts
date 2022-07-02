import express, { NextFunction, Request, Response } from 'express'
import 'express-async-errors'

import router from './routes'
import middlewares, { notFoundErrorHandler } from './middlewares'

const app = express()

import config from '../../config.json'
import Server from './Server'
import { dataContract, appContract } from '../eth'

const start = () => {
  const server = new Server({
    dataContract,
    appContract,
    numOracles: config.numOracles
  })

  const contextHandler = (req: Request, _: Response, next: NextFunction) => {
    req.locals = { dataContract, appContract, server }
    next()
  }

  app.set('json spaces', 2)
  app.use([contextHandler, ...middlewares, router])
  app.listen(3000, () => console.log(`Oracles server 👂 on port 3000`))

  app.all('*', notFoundErrorHandler)
}

start()
