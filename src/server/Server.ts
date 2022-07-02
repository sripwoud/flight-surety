import config from './config'

const { NUM_ACCOUNTS } = config // update in truffle.js and start ganacle-cli with the right number of accounts if necessary

class Server {
  oracles: number[]
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
    this.oracles = [...Array(NUM_ACCOUNTS - numOracles).keys()]

    this.init()
  }

  // random number out of [10, 20, 30, 40, 50]
  getStatusCode = () => (Math.floor(Math.random() * 5) + 1) * 10

  logEvent = (...args: any[]) => {
    console.log(args[3])
  }

  listenToInfoEvents = () => {
    ;[
      'OracleRegistered',
      'AirlineRegistered',
      'OracleReport',
      'FlightStatusInfo',
      'FlightProcessed',
      'Funded',
      'WithdrawRequest',
      'Paid',
      'Credited'
    ].forEach(this.logEvent)
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

    this.appContract.on('FlightRegistered', (...args: any[]) => {
      this.logEvent(...args)
      this.storeFlight()
    })

    this.appContract.on('OracleRequest', (...args: any[]) => {
      this.logEvent(...args)
      // this.submitResponses(flight, destination, timestamp)
    })

    await this.dataContract.authorizeCaller(this.appContract.address)

    // register oracles
    const REGISTRATION_FEE = await this.appContract.REGISTRATION_FEE()

    await Promise.all(
      this.oracles.map(async (oracle: number) => {
        await this.appContract
          .connect(oracle)
          .registerOracle.send(REGISTRATION_FEE)
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
      this.oracles.map(async (oracle: number) => {
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

    const indexFlightKeys: number = await this.dataContract.indexFlightKeys()
    for (let i = 0; i < indexFlightKeys + 1; i++) {
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
