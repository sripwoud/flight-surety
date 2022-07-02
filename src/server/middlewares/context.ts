import Server from '../Server'
import { dataContract, appContract } from '../web3'
import { NUM_ORACLES } from '../config'

export default (req, res, next) => {
  const server = Server({ dataContract, appContract })
  server.init(NUM_ORACLES)

  req.locals = { dataContract, appContract }
  next()
}
