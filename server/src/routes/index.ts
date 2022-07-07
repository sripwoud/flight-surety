import { Router } from 'express'

import apiRouter from './api'
import flightRouter from './flight'
import flightKeyRouter from './flight-key'
import flightsRouter from './flights'
import responseRouter from './response'

const router = Router()

router.get('/', apiRouter)
router.get('/flights', flightsRouter)
router.get('/flight/:key', flightRouter)
router.get('/response/:key', responseRouter)
router.post('/flight-key', flightKeyRouter)

export default router
