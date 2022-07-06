import { ethers } from 'ethers'

import provider from './provider'

const Signers = (num: number) =>
  [...Array(num).keys()].map((index) =>
    ethers.Wallet.fromMnemonic(
      process.env.mnemonic!,
      `m/44'/60'/0'/0/${index}`
    ).connect(provider)
  )

export default Signers
