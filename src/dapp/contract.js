import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json'
import Config from './config.json'
import Web3 from 'web3'

export default class Contract {
  constructor (network, callback) {
    let config = Config[network]
    // Inject web3
    if (window.ethereum) {
      // use metamask's providers
      // modern browsers
      this.web3 = new Web3(window.ethereum)
      // Request accounts access
      try {
        window.ethereum.enable()
      } catch (error) {
        console.error('User denied access to accounts')
      }
    } else if (window.web3) {
      // legacy browsers
      this.web3 = new Web3(web3.currentProvider)
    } else {
      // fallback for non dapp browsers
      this.web3 = new Web3(new Web3.providers.HttpProvider(config.url))
    }

    // Load contract
    this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress)
    this.initialize(callback)
    this.account = null
    this.flights = []
  }

  initialize (callback) {
    this.web3.eth.getAccounts((error, accts) => {
      if (!error) {
        this.account = accts[0]
        callback()
      } else {
        console.error(error)
      }
    })
  }

  isOperational (callback) {
    let self = this
    self.flightSuretyApp.methods
      .operational()
      .call({ from: self.account }, callback)
  }

  fetchFlightStatus (flight, callback) {
    let self = this
    let payload = {
      airline: self.account,
      flight: flight,
      timestamp: Math.floor(Date.now() / 1000)
    }
    self.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send({ from: self.account }, (error, result) => {
        callback(error, payload)
      })
  }

  registerAirline (airline, callback) {
    let self = this
    let payload = {
      airline: self.account,
      newAirline: airline
    }
    self.flightSuretyApp.methods
      .registerAirline(payload.newAirline)
      .send({ from: self.account }, (error, result) => {
        payload.additionalVotesRequired = result
        callback(error, payload)
      })
  }

  registerFlight (takeOff, landing, flight, price, from, to, callback) {
    let self = this
    let payload = {
      address: self.account,
      from: from,
      to: to,
      takeOff: takeOff,
      landing: landing,
      flight: flight,
      price: price
    }
    self.flightSuretyApp.methods
      .registerFlight(takeOff, landing, flight, price, from, to)
      .send({ from: self.account }, (error, result) => {
        callback(error, payload)
      })
  }

  fund (amount, callback) {
    let self = this
    self.flightSuretyApp.methods
      .fund()
      .send({
        from: self.account,
        value: self.web3.utils.toWei(amount, 'ether')
      }, (error, result) => {
        callback(error, { address: self.account, amount: amount })
      })
  }
}
