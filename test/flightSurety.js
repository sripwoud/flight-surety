
const Test = require('../config/testConfig.js')
const BigNumber = require('bignumber.js')
const truffleAssert = require('truffle-assertions')
const keccak256 = require('keccak256')

contract('Flight Surety Tests', async (accounts) => {
  var config
  before('setup contract', async () => {
    config = await Test.Config(accounts)
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address)
  })

  it('First account is firstAirline', async () => {
    assert.equal(config.firstAirline, accounts[1])
  })
  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/
  const minFund = web3.utils.toWei('10', 'ether')

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

  it('(Data Contract) Before providing funding, an airline cannot register another one', async () => {
    try {
      await config.flightSuretyApp.registerAirline(accounts[2], { from: config.firstAirline })
    } catch (error) {
      assert(error.message.includes('Airline must provide funding'), 'Error: wrong revert message')
    }
  })

  it('(Data Contract) Airline can provide funding', async () => {
    const balanceBefore = await web3.eth.getBalance(config.flightSuretyData.address)
    await config.flightSuretyApp.fund({ from: config.firstAirline, value: minFund })
    const airline = await config.flightSuretyData.airlines.call(config.firstAirline)
    assert(airline.funded, 'Error: Airline funding should have been registered')
    const balanceAfter = await web3.eth.getBalance(config.flightSuretyData.address)
    assert.equal(+balanceBefore + minFund, +balanceAfter, 'Error: 10 ETH should have been transfered')
  })


  it('((multiparty) Only first Airline can register an airline when less than 4 airlines are registered', async () => {
    // register one other airline
    await config.flightSuretyApp.registerAirline(
      accounts[2],
      { from: config.firstAirline })
    const airline = await config.flightSuretyData.airlines.call(accounts[2])
    assert(await airline.registered)

    // Third airline fails to register new airline because not registered
    try {
      await config.flightSuretyApp.registerAirline(config.testAddresses[3], { from: accounts[4] })
    } catch (error) {
      assert(error.message.includes('Airline must be registered'), `${error.message}`)
    }

    // second airline provides funding
    await config.flightSuretyApp.fund({ from: accounts[2], value: minFund })
    // Second airline can't register airline because not the first one
    try {
      await config.flightSuretyApp.registerAirline(config.testAddresses[3], { from: accounts[2] })
    } catch (error) {
      assert(error.message.includes('Less than 4 airlines registered'), `${error.message}`)
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

  it('(App contract) Airline can register a flight', async () => {
    const takeOff = Math.floor(Date.now() / 1000) + 1000
    const tx = await config.flightSuretyApp.registerFlight(
      takeOff,
      takeOff + 1000,
      '123',
      '1000',
      { from: config.firstAirline })

    truffleAssert.eventEmitted(tx, 'FlightRegistered', ev => {
      return ev.ref === '123'
    })
  })
})
