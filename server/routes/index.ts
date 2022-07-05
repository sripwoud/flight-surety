import { Request, Response, Router } from 'express'

import getFlightKey from '../middlewares/get-flight-key'
import apiRouter from './api'
import flightRouter from './flight'
import flightsRouter from './flights'
import responseRouter from './response'

const router = Router()

router.get('/', apiRouter)
router.get('/flights', flightsRouter)
router.post('/flight-key', getFlightKey, (req: Request, res: Response) => {
  res.send(req.locals.key)
})
router.get('/flight/:key', flightRouter)
router.post('/response', getFlightKey, responseRouter)

export default router
