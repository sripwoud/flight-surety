import web3 from './web3'

import FlightSuretyApp from '../../../contracts/out/FlightSuretyApp.sol/FlightSuretyApp.json'
import FlightSuretyData from '../../../contracts/out/FlightSuretyData.sol/FlightSuretyData.json'

const dataContract = new web3.eth.Contract(
  FlightSuretyData.abi,
  config.dataAddress
)

const appContract = new web3.eth.Contract(
  FlightSuretyApp.abi,
  config.appAddress
)

export { dataContract, appContract }
