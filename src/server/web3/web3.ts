import Web3 from 'web3'

import config from '../config'

const web3 = new Web3(new Web3.providers.HttpProvider(config.rpcUrl))
web3.eth.defaultAccount = web3.eth.accounts.privateKeyToAccount(
  process.env.DEV_PKEY!
).address

export default web3
