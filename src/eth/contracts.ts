import { ethers } from 'ethers'

import app from '../../_contracts/out/FlightSuretyApp.sol/FlightSuretyApp.json'
import data from '../../_contracts/out/FlightSuretyData.sol/FlightSuretyData.json'

import config from '../config'
import wallet from './wallet'

const dataContract = new ethers.Contract(
  config.dataContractAddress,
  data.abi
).connect(wallet)
const appContract = new ethers.Contract(
  config.appContractAddress,
  app.abi
).connect(wallet)

export { dataContract, appContract }
