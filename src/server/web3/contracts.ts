import web3 from './web3'

import FlightSuretyApp from '../../../contracts/out/FlightSuretyApp.sol/FlightSuretyApp.json'
import FlightSuretyData from '../../../contracts/out/FlightSuretyData.sol/FlightSuretyData.json'

import config from '../config'

const dataContract = new web3.eth.Contract(
  // @ts-ignore
  FlightSuretyData.abi,
  config.dataContractAddress
)

const appContract = new web3.eth.Contract(
  // @ts-ignore
  FlightSuretyApp.abi,
  config.appContractAddress
)

export { dataContract, appContract }
