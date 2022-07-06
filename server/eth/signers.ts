import { ethers } from 'ethers'

import provider from './provider'

const { NODE_ENV, MNEMONIC_DEV, MNEMONIC_PROD } = process.env
const mnemonic = NODE_ENV === 'development' ? MNEMONIC_DEV : MNEMONIC_PROD

const Signers = (num: number) =>
  [...Array(num).keys()].map((index) =>
    ethers.Wallet.fromMnemonic(mnemonic!, `m/44'/60'/0'/0/${index}`).connect(
      provider
    )
  )

export default Signers
