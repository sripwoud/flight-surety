import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json'
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json'
import Config from './config.json'
import Web3 from 'web3'
import express from 'express'
require('babel-polyfill')

let config = Config['localhost']
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')))
web3.eth.defaultAccount = web3.eth.accounts[0]
const flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress)
const flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress)
const NUMBER_OF_ACCOUNTS = 50 // update in truffle.js and start ganacle-cli with the right number of accounts if necessary
const NUMBER_OF_ORACLES = 30

const Server = {
  oracles: [],
  states: {
    0: 'unknow',
    10: 'on time',
    20: 'late due to airline',
    30: 'late due to weather',
    40: 'late due to technical reason',
    50: 'late due to other reason'
  },

  init: async function (numberOracles) {
    // EVENTS LISTENERS
    flightSuretyApp.events.OracleRequest()
      .on('error', error => { console.log(error) })
      .on('data', log => {
        console.log(`${log.event}`)
      })
    flightSuretyApp.events.OracleRegistered()
      .on('error', error => { console.log(error) })
      .on('data', log => {
        const { event, returnValues: indexes } = log
        console.log(`${event}: indexes ${indexes[0]}`)
      })
    flightSuretyApp.events.OracleRequest()
      .on('error', error => { console.log(error) })
      .on('data', log => {
        const { event, returnValues: { index, flight, destination, timestamp } } = log
        console.log(`${event}: index ${index}, flight ${flight}, destination ${destination}, landing ${timestamp}`)
      })
    flightSuretyApp.events.OracleRegistered()
      .on('error', error => { console.log(error) })
      .on('data', log => {
        const { event, returnValues: indexes } = log
        console.log(`${event}: indexes ${indexes[0]}`)
      })
      // REDUNDANT: already displayed on front end
    // flightSuretyApp.events.FlightRegistered()
    //   .on('error', error => { console.log(error) })
    //   .on('data', log => {
    //     const { flightRef, to, landing } = log.returnValues
    //     console.log(`FlightRegistered: ${flightRef} lading in ${to} at ${landing}`)
    //   })
    // flightSuretyData.events.Funded()
    //   .on('error', error => { console.log(error) })
    //   .on('data', log => {
    //     const { airline } = log.returnValues
    //     console.log(`Airline ${airline} provided funding`)
    //   })

    // Authorize
    await flightSuretyData.methods.authorizeCaller(flightSuretyApp._address)

    // Add oracles addresses
    this.oracles = (await web3.eth.getAccounts()).slice(NUMBER_OF_ACCOUNTS - numberOracles)
    // register oracles
    const REGISTRATION_FEE = await flightSuretyApp.methods.REGISTRATION_FEE().call()
    this.oracles.forEach(async account => {
      try {
        await flightSuretyApp.methods.registerOracle().send({
          from: account,
          value: REGISTRATION_FEE,
          gas: 4712388,
          gasPrice: 100000000000
        })
      } catch (error) {
        console.log(error.message)
      }
    })
  }
}

Server.init(NUMBER_OF_ORACLES)



const app = express()
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  })
})

export default app
