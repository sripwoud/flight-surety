import { ethers } from 'ethers'
import config from '../../config.json'

const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)

export default provider
