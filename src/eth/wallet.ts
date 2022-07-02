import { ethers } from 'ethers'

import provider from './provider'

const wallet = ethers.Wallet.fromMnemonic(process.env.mnemonic!)
wallet.connect(provider)

export default wallet
