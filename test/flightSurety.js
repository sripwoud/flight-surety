
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

  it('(Data Contract) Registers first airline at deployment', async () => {
    assert.equal(await config.flightSuretyData.firstAirline.call(), config.firstAirline)
    assert.equal(await config.flightSuretyData.registeredAirlinesCount.call(), 1)
    const firstAirline = await config.flightSuretyData.airlines.call(config.firstAirline)
    assert(await firstAirline.registered)
  })

  it('((multiparty) Only first Airline can register an airline when less than 4 airlines are registered', async () => {
    // Fail if airline not registered
    try {
      await config.flightSuretyApp.registerAirline(config.testAddresses[3], { from: accounts[4] })
    } catch (error) {
      assert(error.message.includes('Airline must be registered'), 'Error wrong revert message')
    }

    // register one other airline
    await config.flightSuretyApp.registerAirline(
      accounts[2],
      { from: config.firstAirline })
    const airline = await config.flightSuretyData.airlines.call(accounts[2])
    assert(await airline.registered)

    // Fail if not first airline as long as less than 4 airlines registered
    try {
      await config.flightSuretyApp.registerAirline(accounts[3], { from: accounts[2] })
    } catch (error) {
      assert(error.message.includes('Less than 4 airlines registered'), 'Error wrong revert message')
    }
  })

  it('(multiparty) Starting from 4 airlines, half of the registered airlines must agree to register a new one', async () => {
    // register 2 new airlines
    await config.flightSuretyApp.registerAirline(
      accounts[3],
      { from: config.firstAirline })
    await config.flightSuretyApp.registerAirline(
      accounts[4],
      { from: config.firstAirline })
    assert.equal(await config.flightSuretyData.registeredAirlinesCount.call(), 4)

    // First airline fails to register 5th one
    await config.flightSuretyApp.registerAirline(accounts[5], { from: config.firstAirline })
    let airline = await config.flightSuretyData.airlines.call(accounts[5])
    assert.equal(await airline.registered, false, 'Error: 5th airline should not have been registered')

    // Cannot vote twice
    try {
      await config.flightSuretyApp.registerAirline(accounts[5], { from: config.firstAirline })
    } catch (error) {
      assert(error.message.includes('Caller cannot call this function twice'), 'Error: wrong revert message')
    }

    // Let second other airline vote
    await config.flightSuretyApp.registerAirline(accounts[5], { from: accounts[2] })

    airline = await config.flightSuretyData.airlines.call(accounts[5])
    assert(await airline.registered, 'Error: 5th airline was not registered')
  })


/*
  it('(App Contract) Test var at deployment', async () => {
    assert.equal(await config.flightSuretyApp.test.call(), config.flightSuretyData.address)
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
