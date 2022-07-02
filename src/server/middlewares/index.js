import cors from 'cors'
import express from 'express'

import contextHandler from './context'

export default [cors(), express.json(), contextHandler]

export { default as getFlightKey } from './get-flight-key'
