import express, { NextFunction, Request, Response } from 'express'

import router from './routes'
import middlewares from './middlewares'

const app = express()

import config from './config'
import Server from './Server'
import { dataContract, appContract } from './web3'

const start = () => {
  const server = new Server({ dataContract, appContract })
  server.init(config.NUM_ORACLES)

  const contextHandler = (req: Request, _: Response, next: NextFunction) => {
    req.locals = { dataContract, appContract, server }
    next()
  }

  app.set('json spaces', 2)
  app.use([contextHandler, ...middlewares, router])
  app.listen(3000, () => console.log(`Oracles server 👂 on port 3000`))
}

start()
