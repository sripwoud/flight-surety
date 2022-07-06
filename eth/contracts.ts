import { ethers } from 'ethers'

import app from '../contracts/out/FlightSuretyApp.sol/FlightSuretyApp.json'
import data from '../contracts/out/FlightSuretyData.sol/FlightSuretyData.json'

import config from '../config.json'
import provider from './provider'

const dataContract = new ethers.Contract(config.dataAddress, data.abi, provider)
const appContract = new ethers.Contract(config.appAddress, app.abi, provider)

export { dataContract, appContract }
