import Signers from '../eth/signers'
import { BigNumber, Signer, Wallet } from 'ethers'

const watchEvent = (eventName: string, contract: any) => {
  contract.on(eventName, (data: any) => {
    console.log(eventName, data)
  })
}

class Server {
  oracles: Wallet[]
  flights: { index: number; key: string; flight: string }[] = []
  // states: Record<number, string> = {
  //   0: 'unknown',
  //   10: 'on time',
  //   20: 'late due to airline',
  //   30: 'late due to weather',
  //   40: 'late due to technical reason',
  //   50: 'late due to other reason'
  // }

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

  // random number out of [10, 20, 30, 40, 50]
  getStatusCode = () => (Math.floor(Math.random() * 5) + 1) * 10

  listenToInfoEvents = () => {
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

  storeFlight = async () => {
    const indexFlightKeys = await this.dataContract.indexFlightKeys()
    const key = await this.dataContract.flightKeys(indexFlightKeys)
    const flight = await this.dataContract.flights(key)

    for (let j = 0; j < 9; j++) {
      delete flight[j]
    }

    this.flights.push({
      index: indexFlightKeys,
      key: key,
      flight: flight
    })
  }

  init = async () => {
    this.listenToInfoEvents()

    this.appContract.on('FlightRegistered', (data: any[]) => {
      console.log('FlightRegistered', data)
      this.storeFlight()
    })

    this.appContract.on('OracleRequest', (data: any[]) => {
      console.log('FlightRegistered', data)
      // this.submitResponses(flight, destination, timestamp)
    })

    const REGISTRATION_FEE = await this.appContract.REGISTRATION_FEE()

    // register oracles
    const registerOracle = async (oracle: Signer) => {
      const tx = await this.appContract
        .connect(oracle)
        .registerOracle({ value: REGISTRATION_FEE })
      await tx.wait(1)
    }

    for (const oracle of this.oracles) {
      // console.log(oracle.address)
      try {
        await registerOracle(oracle)
      } catch (e) {
        // swallow
        console.log(`could not register oracle ${oracle.address}`)
      }
    }

    // get and store existing flights
    await this.updateFlights()
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

  updateFlights = async () => {
    // Clean array
    this.flights = []

    const indexFlightKeys: BigNumber = await this.dataContract.indexFlightKeys()

    for (let i = 0; i < indexFlightKeys.toNumber(); i++) {
      const key: string = await this.dataContract.flightKeys(i)
      const flight = await this.dataContract.flights(key)

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
  }
}

export default Server
