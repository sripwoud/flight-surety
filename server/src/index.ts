import express, { NextFunction, Request, Response } from 'express'
import 'express-async-errors'

import router from './routes'
import middlewares, { notFoundErrorHandler } from './middlewares'
import Server from './Server'
import { dataContract, appContract, oraclesContract } from './eth'

const port = process.env.SERVER_PORT || 3001
const app = express()

const start = async () => {
  const server = new Server({
    dataContract,
    appContract,
    oraclesContract
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
  app.all('*', notFoundErrorHandler)

  app.listen(port, () => console.log(`Oracles server 👂 on port ${port}`))
}

try {
  start()
} catch (e) {
  console.log('start up failure', e)
  process.exit(1)
}
