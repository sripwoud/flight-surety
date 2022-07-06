import { ethers } from 'ethers'

import app from './FlightSuretyApp.json'
import data from './FlightSuretyData.json'

import addresses from './addresses'
import provider from '../provider'

const dataContract = new ethers.Contract(addresses.data, data.abi, provider)
const appContract = new ethers.Contract(addresses.app, app.abi, provider)

export { dataContract, appContract }
