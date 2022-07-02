import Web3 from 'web3'

import config from '../config.json'

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws'))
)
web3.eth.defaultAccount = web3.eth.accounts[0]

export default web3
