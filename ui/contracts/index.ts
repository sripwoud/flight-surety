import { ethers } from 'ethers'

import addresses from './addresses'

import appArtifact from './FlightSuretyApp.json'
import dataArtifact from './FlightSuretyData.json'

const data = new ethers.Contract(addresses.data, dataArtifact.abi)
const app = new ethers.Contract(addresses.app, appArtifact.abi)

export { data, app }
