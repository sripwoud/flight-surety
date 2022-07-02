import config from './config.json'

const { NUMBER_ACCOUNTS } = config // update in truffle.js and start ganacle-cli with the right number of accounts if necessary

const Server = ({ dataContract, appContract }) => ({
  oracles: [],
  flights: [],
  states: {
    0: 'unknown',
    10: 'on time',
    20: 'late due to airline',
    30: 'late due to weather',
    40: 'late due to technical reason',
    50: 'late due to other reason'
  },

  init: async function (numberOracles) {
    // EVENTS LISTENERS
    appContract.events
      .OracleRegistered()
      .on('data', (log) => {
        const {
          event,
          returnValues: { indexes }
        } = log
        console.log(
          `${event}: indexes ${indexes[0]} ${indexes[1]} ${indexes[2]}`
        )
      })
      .on('error', (error) => {
        console.log(error)
      })

    dataContract.events
      .AirlineRegistered()
      .on('data', (log) => {
        const {
          returnValues: { origin, newAirline }
        } = log
        console.log(`${origin} registered ${newAirline}`)
      })
      .on('error', (error) => {
        console.log(error)
      })

    appContract.events
      .FlightRegistered()
      .on('data', async (log) => {
        const {
          event,
          returnValues: { flightRef, to, landing }
        } = log
        console.log(`${event}: ${flightRef} to ${to} landing ${landing}`)

        // store new flight
        const indexFlightKeys = await dataContract.methods
          .indexFlightKeys()
          .call()
        const key = await dataContract.methods
          .flightKeys(indexFlightKeys)
          .call()
        const flight = await dataContract.methods.flights(key).call()
        for (let j = 0; j < 9; j++) {
          delete flight[j]
        }
        this.flights.push({
          index: indexFlightKeys,
          key: key,
          flight: flight
        })
      })
      .on('error', (error) => {
        console.log(error)
      })

    appContract.events
      .OracleRequest()
      .on('error', (error) => {
        console.log(error)
      })
      .on('data', async (log) => {
        const {
          event,
          returnValues: { index, flight, destination, timestamp }
        } = log

        console.log(
          `${event}: index ${index}, flight ${flight}, to ${destination}, landing ${timestamp}`
        )
        await this.submitResponses(flight, destination, timestamp)
      })

    appContract.events.OracleReport().on('data', (log) => {
      const {
        event,
        returnValues: { flight, destination, timestamp, status }
      } = log
      console.log(
        `${event}: flight ${flight}, to ${destination}, landing ${timestamp}, status ${this.states[status]}`
      )
    })

    appContract.events
      .FlightStatusInfo()
      .on('data', (log) => {
        const {
          event,
          returnValues: { flight, destination, timestamp, status }
        } = log
        console.log(
          `${event}: flight ${flight}, to ${destination}, landing ${timestamp}, status ${this.states[status]}`
        )
      })
      .on('error', (error) => {
        console.log(error)
      })

    appContract.events.FlightProcessed().on('data', (log) => {
      const {
        event,
        returnValues: { flightRef, destination, timestamp, statusCode }
      } = log
      console.log(
        `${event}: flight ${flightRef}, to ${destination}, landing ${timestamp}, status ${this.states[statusCode]}`
      )
    })

    dataContract.events
      .Funded()
      .on('data', (log) => {
        const {
          returnValues: { airline }
        } = log
        console.log(`${airline} provided funding`)
      })
      .on('error', (error) => console.log(error))

    appContract.events.WithdrawRequest().on('data', (log) => {
      const {
        event,
        returnValues: { recipient }
      } = log
      console.log(`${event} from ${recipient}`)
    })

    dataContract.events.Paid().on('data', (log) => {
      const {
        event,
        returnValues: { recipient, amount }
      } = log
      console.log(`${event} ${amount} to ${recipient}`)
    })

    dataContract.events.Credited().on('data', (log) => {
      const {
        event,
        returnValues: { passenger, amount }
      } = log
      console.log(`${event} ${amount} to ${passenger}`)
    })

    // Authorize
    await dataContract.methods.authorizeCaller(appContract._address)

    // Add oracles addresses
    this.oracles = (await web3.eth.getAccounts()).slice(
      NUMBER_ACCOUNTS - numberOracles
    )
    // register oracles
    const REGISTRATION_FEE = await appContract.methods.REGISTRATION_FEE().call()
    this.oracles.forEach(async (account) => {
      try {
        await appContract.methods.registerOracle().send({
          from: account,
          value: REGISTRATION_FEE,
          gas: 4712388,
          gasPrice: 100000000000
        })
      } catch (error) {
        // console.log(error.message)
      }
    })

    // get and store existing flights
    this.updateFlights()
  },

  submitResponses: async function (flight, destination, timestamp) {
    this.oracles.forEach(async (oracle) => {
      // random number out of [10, 20, 30, 40, 50]
      const statusCode = (Math.floor(Math.random() * 5) + 1) * 10
      // get indexes
      const oracleIndexes = await appContract.methods
        .getMyIndexes()
        .call({ from: oracle })
      oracleIndexes.forEach(async (index) => {
        try {
          await appContract.methods
            .submitOracleResponse(
              index,
              flight,
              destination,
              +timestamp,
              statusCode
            )
            .send({ from: oracle })
        } catch (error) {
          // console.log(error.message)
        }
      })
    })
  },

  updateFlights: async function () {
    // Clean array
    this.flights = []
    try {
      const indexFlightKeys = await dataContract.methods
        .indexFlightKeys()
        .call()
      for (let i = 0; i < indexFlightKeys + 1; i++) {
        const key = await dataContract.methods.flightKeys(i).call()
        const flight = await dataContract.methods.flights(key).call()
        for (let j = 0; j < 9; j++) {
          delete flight[j]
        }
        // as unique key, an index is added and will be displayed in the front end form (instead of displaying the hash key)
        this.flights.push({
          index: i,
          key: key,
          flight: flight
        })
      }
    } catch (error) {
      // console.log('No flights to add')
    }
  }
})

export default Server
