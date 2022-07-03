import { Router } from 'express'

import getFlightKey from '../middlewares/get-flight-key'
import apiRouter from './api'
import flightRouter from './flight'
import flightsRouter from './flights'
import responseRouter from './response'

const router = Router()

router.get('/', apiRouter)
router.get('/flights', flightsRouter)
router.get('/flight/:ref.:dest.:landing', getFlightKey, flightRouter)
router.get('/response/:ref.:dest.:landing', getFlightKey, responseRouter)

export default router
