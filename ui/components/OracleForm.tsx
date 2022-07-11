import React from 'react'
import { Button, Table } from 'semantic-ui-react'
import { useContractFunction } from '@usedapp/core'

import { oracles } from '../contracts'
import Flight from './Flights/Flight'
import FlightsList from './Flights/FlightsList'
import { useFlights } from '../hooks'

const OracleForm = () => {
  const { send: fetchFlightStatus } = useContractFunction(
    oracles,
    'fetchFlightStatus'
  )

  const flights = useFlights()
    .filter(({ statusCode }) => statusCode === 'Unknown')
    .map((flightProps) => {
      const { key } = flightProps
      return (
        <Flight key={key} flightProps={flightProps}>
          <Table.Cell collapsing>
            <Button onClick={() => fetchFlightStatus(key)}>Ask Status</Button>
          </Table.Cell>
        </Flight>
      )
    })

  return <FlightsList flights={flights} title="Fetch Flight Status" />
}

export default OracleForm
