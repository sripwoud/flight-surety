import React from 'react'
import { Divider } from 'semantic-ui-react'
import { useEthers } from '@usedapp/core'

import FlightBook from './Flights/FlightBook'
import FlightClaim from './Flights/FlightClaim'
import FLightsList from './Flights/FlightsList'
import { useFlights } from '../hooks'

const PaxForm = () => {
  const { account } = useEthers()

  // @ts-ignore
  const [bookedFlights, notBookedFlights] = useFlights(account).reduce(
    // @ts-ignore
    ([bookedFlights, notBookedFlights], flightProps) => {
      const { key } = flightProps
      return flightProps.paxOnFlight
        ? [
            [
              ...bookedFlights,
              <FlightClaim key={key} flightProps={flightProps} />
            ],

            notBookedFlights
          ]
        : [
            bookedFlights,
            [
              ...notBookedFlights,
              <FlightBook key={key} flightProps={flightProps} />
            ]
          ]
    },
    [[], []]
  )

  return (
    <>
      {notBookedFlights && (
        <FLightsList
          title="Book Flight"
          extraHeaders={['Insurance']}
          flights={notBookedFlights}
        />
      )}
      <Divider />
      {bookedFlights && (
        <FLightsList
          title="Booked Fights"
          extraHeaders={['Status']}
          flights={bookedFlights}
        />
      )}
    </>
  )
}

export default PaxForm
