import { ethers } from 'ethers'

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)

export default provider
