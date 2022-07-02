import { ethers } from 'ethers'
import config from '../config'

const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)

export default provider
