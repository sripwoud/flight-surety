import Signers from './eth/signers'
import { BigNumber, ethers, utils, Wallet } from 'ethers'

const watchEvent = (eventName: string, contract: any) => {
  contract.on(eventName, (data: any) => {
    console.log(eventName, data)
  })
}

const STATUS_CODES = {
  0: 'Unknown',
  1: 'On time',
  2: 'Late Due to Airline',
  3: 'Late Due to Weather',
  4: 'Late Due to Technical Reason',
  5: 'Late Due to Other Reason'
}

type Flight = {
  key: string
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

class Server {
  oracles: Wallet[] = []
  flights: Record<string, Flight> = {}
  dataContract
  appContract
  oraclesContract
  numOracles

  constructor({
    dataContract,
    appContract,
    oraclesContract,
    numOracles
  }: {
    dataContract: any
    appContract: any
    oraclesContract: any
    numOracles: number
  }) {
    this.dataContract = dataContract
    this.appContract = appContract
    this.oraclesContract = oraclesContract
    this.numOracles = numOracles
  }

  // random number out of [1, 2, 3, 4, 5]
  getStatusCode = () => Math.floor(Math.random() * 5) + 1

  watchAndLogEvents = () => {
    ;['AirlineRegistered', 'Funded', 'Paid', 'Credited'].forEach((event) => {
      watchEvent(event, this.dataContract)
    })
    ;['WithdrawRequest'].forEach((event) => {
      watchEvent(event, this.appContract)
    })
    ;['OracleRegistered', 'OracleReport', 'FlightProcessed'].forEach(
      (event) => {
        watchEvent(event, this.oraclesContract)
      }
    )
  }

  watchAndReactToEvents = () => {
    this.appContract.on('FlightRegistered', async (...data: any) => {
      console.log('FlightRegistered', data.slice(0, 4))
      const key = utils.solidityKeccak256(
        ['string', 'string', 'string', 'uint'],
        [...data.slice(0, 4)]
      )

      const flight = await this.dataContract.flights(key)

      this.flights[key] = {
        key: key,
        isRegistered: flight.isRegistered,
        // @ts-ignore
        statusCode: STATUS_CODES[flight.statusCode],
        takeOff: new Date(flight.takeOff.toNumber()),
        landing: new Date(flight.landing.toNumber()),
        airline: flight.airline,
        flightRef: flight.flightRef,
        price: utils.formatEther(flight.price),
        from: flight.from,
        to: flight.to
      }
    })

    this.oraclesContract.on(
      'OracleRequest',
      async (index: number, key: string) => {
        console.log('OracleRequest', { index, key })
        await this.submitResponses(index, key)
      }
    )

    // @ts-ignore
    this.oraclesContract.on(
      'FlightStatusInfo',
      (key: string, statusCode: number) => {
        console.log('FlightStatusInfo', { key, statusCode })
        // @ts-ignore
        this.flights[key].statusCode = STATUS_CODES[statusCode]
      }
    )
  }

  updateFlights = async () => {
    const indexFlightKeys: BigNumber = await this.dataContract.indexFlightKeys()

    for (let i = 0; i < indexFlightKeys.toNumber(); i++) {
      const key = await this.dataContract.flightKeys(i)
      const flight = await this.dataContract.flights(key)

      this.flights[key] = {
        key: key,
        isRegistered: flight.isRegistered,
        // @ts-ignore
        statusCode: STATUS_CODES[flight.statusCode],
        takeOff: new Date(flight.takeOff.toNumber()),
        landing: new Date(flight.landing.toNumber()),
        airline: flight.airline,
        flightRef: flight.flightRef,
        price: utils.formatEther(flight.price),
        from: flight.from,
        to: flight.to
      }
    }
  }

  submitResponses = async (index: number, key: string) => {
    for (const oracle of this.oracles) {
      const statusCode = this.getStatusCode()
      try {
        const oracleIndexes: number[] = await this.oraclesContract
          .connect(oracle)
          .getMyIndexes()

        for (const index of oracleIndexes) {
          if (oracleIndexes.includes(index)) {
            try {
              await this.oraclesContract
                .connect(oracle)
                .submitOracleResponse(index, key, statusCode)
              console.log(`oracle ${oracle.address} submitted response`)
            } catch (e) {
              console.log(`${oracle.address} ${index} submit failed`)
            }
          }
        }
      } catch (e) {
        // swallow
      }
    }
  }

  registerOracles = async () => {
    for (const oracle of Signers(this.numOracles)) {
      try {
        // const REGISTRATION_FEE = await this.oraclesContract.REGISTRATION_FEE()
        await this.oraclesContract.connect(oracle).registerOracle()
        this.oracles.push(oracle)
      } catch (e) {
        // swallow
        // console.log(`could not register oracle ${oracle.address}`)
      }
    }
  }

  registerTwoFlights = async () => {
    const tx = await this.appContract
      .connect(this.oracles[0])
      .registerFlight(
        new Date().getTime(),
        new Date().getTime() + 24 * 60 * 60 * 1000,
        'BER1122',
        ethers.utils.parseEther('1.2'),
        'Paris',
        'Berlin'
      )
    await tx.wait(1)

    await this.appContract
      .connect(this.oracles[0])
      .registerFlight(
        new Date().getTime() + 2 * 24 * 60 * 60 * 1000,
        new Date().getTime() + 3 * 24 * 60 * 60 * 1000,
        'BER2211',
        ethers.utils.parseEther('1'),
        'Berlin',
        'Paris'
      )
    console.log('Airline 0 registered 2 flights')
  }

  init = async () => {
    this.watchAndLogEvents()
    this.watchAndReactToEvents()
    await this.registerOracles()
    await this.registerTwoFlights()
    await this.updateFlights()

    // console.log(this.flights)
  }
}

export default Server
