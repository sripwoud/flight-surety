import Signers from '../eth/signers'
import { BigNumber, ethers, Signer, Wallet } from 'ethers'

const watchEvent = (eventName: string, contract: any) => {
  contract.on(eventName, (data: any) => {
    console.log(eventName, data)
  })
}

const STATUS_CODES = {
  0: 'unknown',
  1: 'On time',
  2: 'Late Due to Airline',
  3: 'Late Due to Weather',
  4: 'Late Due to Technical Reason',
  5: 'Late Due to Other Reason'
}

type Flight = {
  isRegistered: boolean
  statusCode: boolean
  takeOff: Date
  landing: Date
  airline: string
  flightRef: string
  price: string
  from: string
  to: string
}

const parseFlight = (flight: any): Flight => ({
  isRegistered: flight.isRegistered,
  // @ts-ignore
  statusCode: STATUS_CODES[flight.statusCode],
  takeOff: new Date(flight.takeOff),
  landing: new Date(flight.landing),
  airline: flight.airline,
  flightRef: flight.flightRef,
  price: ethers.utils.formatEther(flight.price),
  from: flight.from,
  to: flight.to
})

class Server {
  oracles: Wallet[]
  flights: { index: number; key: string; flight: Flight }[] = []
  dataContract
  appContract

  constructor({
    dataContract,
    appContract,
    numOracles
  }: {
    dataContract: any
    appContract: any
    numOracles: number
  }) {
    this.dataContract = dataContract
    this.appContract = appContract
    this.oracles = Signers(numOracles)
  }

  // random number out of [1, 2, 3, 4, 5]
  getStatusCode = () => Math.floor(Math.random() * 5) + 1

  watchAndLogEvents = () => {
    ;['AirlineRegistered', 'Funded', 'Paid', 'Credited'].forEach((event) => {
      watchEvent(event, this.dataContract)
    })
    ;[
      'OracleRegistered',
      'OracleReport',
      'FlightStatusInfo',
      'FlightProcessed',
      'WithdrawRequest'
    ].forEach((event) => {
      watchEvent(event, this.appContract)
    })
  }

  watchAndReactToEvents = () => {
    this.appContract.on('FlightRegistered', (data: any[]) => {
      console.log('FlightRegistered', data)
      this.storeFlight()
    })

    this.appContract.on('OracleRequest', (data: any) => {
      console.log('OracleRequest', data)
      // this.submitResponses(data.flight, data.destination, data.timestamp)
    })
  }

  storeFlight = async (pos?: number) => {
    const indexFlightKeys = pos || (await this.dataContract.indexFlightKeys())
    const key = await this.dataContract.flightKeys(indexFlightKeys)
    const flight = await this.dataContract.flights(key)

    this.flights.push({
      index: indexFlightKeys,
      key: key,
      // @ts-ignore
      flight: parseFlight(flight)
    })
  }

  updateFlights = async () => {
    this.flights = []

    const indexFlightKeys: BigNumber = await this.dataContract.indexFlightKeys()

    for (let i = 0; i < indexFlightKeys.toNumber(); i++) {
      await this.storeFlight(i)
    }
    console.log({ flights: this.flights.map((f) => f.flight) })
  }

  submitResponses = async (
    flight: string,
    destination: string,
    timestamp: number
  ) => {
    await Promise.all(
      this.oracles.map(async (oracle) => {
        const statusCode = this.getStatusCode()
        // get indexes
        const oracleIndexes: number[] = await this.appContract
          .connect(oracle)
          .getMyIndexes()

        await Promise.all(
          oracleIndexes.map(async (index) => {
            await this.appContract
              .connect(oracle)
              .submitOracleResponse(
                index,
                flight,
                destination + timestamp,
                statusCode
              )
          })
        )
      })
    )
  }

  registerOracle = async (oracle: Signer) => {
    const REGISTRATION_FEE = await this.appContract.REGISTRATION_FEE()
    return this.appContract
      .connect(oracle)
      .registerOracle({ value: REGISTRATION_FEE })
  }

  registerOracles = async () => {
    for (const oracle of this.oracles) {
      // console.log(oracle.address)
      try {
        await this.registerOracle(oracle)
      } catch (e) {
        // swallow
        console.log(`could not register oracle ${oracle.address}`)
      }
    }
  }

  maybeRegisterOneFlight = async () => {
    // register one flight on chain if none yet (dev only)
    const indexFlightKeys = await this.dataContract.indexFlightKeys()
    if (indexFlightKeys.isZero()) {
      await this.appContract
        .connect(this.oracles[0])
        .registerFlight(
          new Date().getTime(),
          new Date().getTime() + 24 * 60 * 60 * 1000,
          'BER1122',
          ethers.utils.parseEther('1'),
          'Berlin',
          'Paris'
        )
      console.log('Airline 0 registered 1 flight')
    }
  }

  init = async () => {
    this.watchAndLogEvents()
    this.watchAndReactToEvents()
    await this.registerOracles()
    await this.maybeRegisterOneFlight()
    await this.updateFlights()
  }
}

export default Server
