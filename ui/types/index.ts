import { BigNumber } from 'ethers'

export type FlightProps = {
  key: string
  from: string
  to: string
  flightRef: string
  price: BigNumber
  takeOff: Date
  landing: Date
  paxOnFlight: boolean
}
