const FlightSuretyApp = artifacts.require('FlightSuretyApp')
const FlightSuretyData = artifacts.require('FlightSuretyData')
const fs = require('fs')
const path = require('path')

module.exports = function (deployer, network, accounts) {
  var flightSuretyData, flightSuretyApp
  let firstAirline = accounts[1]
  deployer.deploy(FlightSuretyData, firstAirline)
    .then(instance => {
      // get the deployed instance of flightSuretyData
      flightSuretyData = instance
      return deployer.deploy(FlightSuretyApp, FlightSuretyData.address)
        .then(instance => {
          flightSuretyApp = instance
          let config = {
            localhost: {
              url: 'http://localhost:8545',
              dataAddress: FlightSuretyData.address,
              appAddress: FlightSuretyApp.address
            }
          }
          fs.writeFileSync(
            path.join(__dirname, '/../src/dapp/config.json'),
            JSON.stringify(config, null, '\t'),
            'utf-8')
          fs.writeFileSync(
            path.join(__dirname, '/../src/server/config.json'),
            JSON.stringify(config, null, '\t'),
            'utf-8')
          return flightSuretyData.authorizeCaller(flightSuretyApp.address)
        })
    })
}
