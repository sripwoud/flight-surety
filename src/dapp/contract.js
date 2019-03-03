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
    this.owner = null
    this.airlines = []
    this.passengers = []
  }

  initialize (callback) {
    this.web3.eth.getAccounts((error, accts) => {
      if (!error) {
        this.owner = accts[0]
        let counter = 1
        while (this.airlines.length < 5) {
          this.airlines.push(accts[counter++])
        }

        while (this.passengers.length < 5) {
          this.passengers.push(accts[counter++])
        }

        callback()
      } else {
        console.erro(error)
      }
    })
  }

  isOperational (callback) {
    let self = this
    self.flightSuretyApp.methods
      .operational()
      .call({ from: self.owner }, callback)
  }

  fetchFlightStatus (flight, callback) {
    let self = this
    let payload = {
      airline: self.airlines[0],
      flight: flight,
      timestamp: Math.floor(Date.now() / 1000)
    }
    self.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send({ from: self.owner }, (error, result) => {
        callback(error, payload)
      })
  }
}
