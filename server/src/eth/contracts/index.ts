import { ethers } from 'ethers'

import app from './FlightSuretyApp.json'
import data from './FlightSuretyData.json'
import oracles from './FlightSuretyOracles.json'

import addresses from './addresses'
import provider from '../provider'

const dataContract = new ethers.Contract(addresses.data, data.abi, provider)
const appContract = new ethers.Contract(addresses.app, app.abi, provider)
const oraclesContract = new ethers.Contract(
  addresses.oracles,
  oracles.abi,
  provider
)

export { dataContract, appContract, oraclesContract }
