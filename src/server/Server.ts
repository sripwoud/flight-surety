import { EventData } from 'web3-eth-contract'

import config from './config'
import { web3 } from './web3'

const { NUM_ACCOUNTS } = config // update in truffle.js and start ganacle-cli with the right number of accounts if necessary

class Server {
  oracles: string[] = []
  flights: { index: number; key: string; flight: string }[] = []
  states: Record<number, string> = {
    0: 'unknown',
    10: 'on time',
    20: 'late due to airline',
    30: 'late due to weather',
    40: 'late due to technical reason',
    50: 'late due to other reason'
  }

  dataContract
  appContract

  constructor({
    dataContract,
    appContract
  }: {
    dataContract: any
    appContract: any
  }) {
    this.dataContract = dataContract
    this.appContract = appContract
  }

  init = async (numberOracles: number) => {
    // EVENTS LISTENERS
    this.appContract.events
      .OracleRegistered()
      .on('data', (log: EventData) => {
        const {
          event,
          returnValues: { indexes }
        } = log
        console.log(
          `${event}: indexes ${indexes[0]} ${indexes[1]} ${indexes[2]}`
        )
      })
      .on('error', (error: Error) => {
        console.log(error)
      })

    this.dataContract.events
      .AirlineRegistered()
      .on('data', (log: EventData) => {
        const {
          returnValues: { origin, newAirline }
        } = log
        console.log(`${origin} registered ${newAirline}`)
      })
      .on('error', (error: Error) => {
        console.log(error)
      })

    this.appContract.events
      .FlightRegistered()
      .on('data', async (log: EventData) => {
        const {
          event,
          returnValues: { flightRef, to, landing }
        } = log
        console.log(`${event}: ${flightRef} to ${to} landing ${landing}`)

        // store new flight
        const indexFlightKeys = await this.dataContract.methods
          .indexFlightKeys()
          .call()
        const key = await this.dataContract.methods
          .flightKeys(indexFlightKeys)
          .call()
        const flight = await this.dataContract.methods.flights(key).call()
        for (let j = 0; j < 9; j++) {
          delete flight[j]
        }
        this.flights.push({
          index: indexFlightKeys,
          key: key,
          flight: flight
        })
      })
      .on('error', (error: Error) => {
        console.log(error)
      })

    this.appContract.events
      .OracleRequest()
      .on('error', (error: Error) => {
        console.log(error)
      })
      .on('data', async (log: EventData) => {
        const {
          event,
          returnValues: { index, flight, destination, timestamp }
        } = log

        console.log(
          `${event}: index ${index}, flight ${flight}, to ${destination}, landing ${timestamp}`
        )
        await this.submitResponses(flight, destination, timestamp)
      })

    this.appContract.events.OracleReport().on('data', (log: EventData) => {
      const {
        event,
        returnValues: { flight, destination, timestamp, status }
      } = log
      console.log(
        `${event}: flight ${flight}, to ${destination}, landing ${timestamp}, status ${this.states[status]}`
      )
    })

    this.appContract.events
      .FlightStatusInfo()
      .on('data', (log: EventData) => {
        const {
          event,
          returnValues: { flight, destination, timestamp, status }
        } = log
        console.log(
          `${event}: flight ${flight}, to ${destination}, landing ${timestamp}, status ${this.states[status]}`
        )
      })
      .on('error', (error: Error) => {
        console.log(error)
      })

    this.appContract.events.FlightProcessed().on('data', (log: EventData) => {
      const {
        event,
        returnValues: { flightRef, destination, timestamp, statusCode }
      } = log
      console.log(
        `${event}: flight ${flightRef}, to ${destination}, landing ${timestamp}, status ${this.states[statusCode]}`
      )
    })

    this.dataContract.events
      .Funded()
      .on('data', (log: EventData) => {
        const {
          returnValues: { airline }
        } = log
        console.log(`${airline} provided funding`)
      })
      .on('error', (error: Error) => console.log(error))

    this.appContract.events.WithdrawRequest().on('data', (log: EventData) => {
      const {
        event,
        returnValues: { recipient }
      } = log
      console.log(`${event} from ${recipient}`)
    })

    this.dataContract.events.Paid().on('data', (log: EventData) => {
      const {
        event,
        returnValues: { recipient, amount }
      } = log
      console.log(`${event} ${amount} to ${recipient}`)
    })

    this.dataContract.events.Credited().on('data', (log: EventData) => {
      const {
        event,
        returnValues: { passenger, amount }
      } = log
      console.log(`${event} ${amount} to ${passenger}`)
    })

    // Authorize
    await this.dataContract.methods.authorizeCaller(this.appContract._address)

    // Add oracles addresses
    this.oracles = (await web3.eth.getAccounts()).slice(
      NUM_ACCOUNTS - numberOracles
    )
    // register oracles
    const REGISTRATION_FEE = await this.appContract.methods
      .REGISTRATION_FEE()
      .call()
    await Promise.all(
      this.oracles.map(async (account: string) => {
        try {
          await this.appContract.methods.registerOracle().send({
            from: account,
            value: REGISTRATION_FEE,
            gas: 4712388,
            gasPrice: 100000000000
          })
        } catch (error) {
          // console.log(error.message)
        }
      })
    )

    // get and store existing flights
    this.updateFlights()
  }

  submitResponses = async (
    flight: string,
    destination: string,
    timestamp: number
  ) => {
    await Promise.all(
      this.oracles.map(async (oracle) => {
        // random number out of [10, 20, 30, 40, 50]
        const statusCode = (Math.floor(Math.random() * 5) + 1) * 10
        // get indexes
        const oracleIndexes: number[] = await this.appContract.methods
          .getMyIndexes()
          .call({ from: oracle })

        await Promise.all(
          oracleIndexes.map(async (index) => {
            try {
              await this.appContract.methods
                .submitOracleResponse(
                  index,
                  flight,
                  destination + timestamp,
                  statusCode
                )
                .send({ from: oracle })
            } catch (error) {
              // console.log(error.message)
            }
          })
        )
      })
    )
  }

  updateFlights = async () => {
    // Clean array
    this.flights = []
    try {
      const indexFlightKeys = await this.dataContract.methods
        .indexFlightKeys()
        .call()
      for (let i = 0; i < indexFlightKeys + 1; i++) {
        const key = await this.dataContract.methods.flightKeys(i).call()
        const flight = await this.dataContract.methods.flights(key).call()
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
}

export default Server
