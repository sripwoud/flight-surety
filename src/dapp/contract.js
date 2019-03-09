import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json'
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json'
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
    this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.appAddress)
    this.initialize(callback)
    this.account = null
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

  async fetchFlightStatus (flight, destination, landing) {
    let self = this
    try {
      await self.flightSuretyApp.methods
        .fetchFlightStatus(flight, destination, landing)
        .send({ from: self.account })
    } catch (error) {
      return {
        error: error
      }
    }
  }

  async registerAirline (airline) {
    let self = this
    try {
      await self.flightSuretyApp.methods
        .registerAirline(airline)
        .send({ from: self.account })
      const votes = await self.flightSuretyApp.methods.votesLeft(airline).call()
      return {
        address: self.account,
        votes: votes
      }
    } catch (error) {
      return {
        error: error
      }
    }
  }

  async registerFlight (takeOff, landing, flight, price, from, to) {
    let self = this
    try {
      await self.flightSuretyApp.methods
        .registerFlight(takeOff, landing, flight, price, from, to)
        .send({ from: self.account })

      // POST flight to server
      fetch('http://localhost:3000/flights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          flight: flight,
          from: from,
          to: to,
          takeOff: takeOff,
          landing: landing,
          price: price
        })
      })

      return {
        address: self.account,
        error: ''
      }
    } catch (error) {
      return {
        address: self.account,
        error: error
      }
    }
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

  async getFlight (flightRef, to, landing) {
    let self = this
    try {
      const flightKey = await self.flightSuretyData.methods.getFlightKey(flightRef, to, landing).call({ from: self.account })
      console.log(flightKey)
      const flight = await self.flightSuretyData.flights().call(flightKey)
      return flight
    } catch (error) {
      console.log(error)
    }
  }
}
