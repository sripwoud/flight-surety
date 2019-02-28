
var Test = require('../config/testConfig.js')
var BigNumber = require('bignumber.js')

contract('Flight Surety Tests', async (accounts) => {
  var config
  before('setup contract', async () => {
    config = await Test.Config(accounts)
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address)
  })

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it('(Data Contract) Has correct initial isOperational() value', async function () {
    // Get operating status
    let status = await config.flightSuretyData.operational.call()
    assert(status, 'Incorrect initial operating status value')
  })

  it('(Data Contract) Blocks access to setOperatingStatus() for non-Contract Owner account', async function () {
    // Ensure that access is denied for non-Contract Owner account
    let accessDenied = false
    try {
      await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] })
    } catch (e) {
      accessDenied = true
    }
    assert(accessDenied, 'Access not restricted to Contract Owner')
  })

  it('(Data Contract) Contract owner can change operational status', async function () {
    await config.flightSuretyData.setOperatingStatus(false)
    assert.equal(await config.flightSuretyData.operational.call(), false, 'Failed to change operational status')
  })

  it('(Data Contract) Blocks access to functions using requireIsOperational when operating status is false', async function () {
    let reverted = false
    try {
      await config.flightSurety.authorizeCaller(config.testAddresses[2])
    } catch (e) {
      reverted = true
    }
    assert(reverted, 'Access not blocked by requireIsOperational')

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true)
  })

  it('(Data Contract) Can add an address to list of authorized callers', async () => {
    assert.equal(await config.flightSuretyData.authorizedCallers.call(config.testAddresses[2]), false)
    await config.flightSuretyData.authorizeCaller(config.testAddresses[2])
    assert(await config.flightSuretyData.authorizedCallers.call(config.testAddresses[2]))
  })
/*
  it('((Data Contract) Can register an airline when less than 4 airlines are registered', async () => {
    let airline = await config.flightSuretyData.airlines.call(config.testAddresses[3])
    assert(!airline.registered, 'Airline should not be already registered')
    await config.flightSuretyData.registerAirline(config.testAddresses[3])
    airline = await config.flightSuretyData.airlines.call(config.testAddresses[3])
    assert(airline.registered, 'Airline should be registered')
  })
*/
  it('(Data Contract) Registers first airline at deployment', async () => {
    assert.equal(await config.flightSuretyData.firstAirline.call(), config.firstAirline)
    assert.equal(await config.flightSuretyData.registeredAirlinesCount.call(), 1)
    const firstAirline = await config.flightSuretyData.airlines.call(config.firstAirline)
    assert(await firstAirline.registered)
  })
/*
  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    // ARRANGE
    let newAirline = accounts[2]

    // ACT
    try {
      await config.flightSuretyApp.registerAirline(newAirline, { from: config.firstAirline })
    } catch (e) {

    }
    let result = await config.flightSuretyData.isAirline.call(newAirline)

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding")
  })
  */
})
