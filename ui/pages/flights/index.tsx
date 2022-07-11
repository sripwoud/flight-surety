import React, { FC } from 'react'
import { Button, Table } from 'semantic-ui-react'

import { useFlights } from '../../hooks'
import Link from 'next/link'
import Flight from '../../components/Flights/Flight'
import FlightsList from '../../components/Flights/FlightsList'

const Flights: FC = () => {
  const flights = useFlights().map((flightProps) => {
    const { key, statusCode } = flightProps
    return (
      <Flight key={key} flightProps={flightProps}>
        <Table.Cell>{statusCode}</Table.Cell>
        <Table.Cell>
          <Link
            key={key}
            passHref={true}
            href={`/flights/[key]`}
            as={`/flights/${key}`}>
            <Button>Go To</Button>
          </Link>
        </Table.Cell>
      </Flight>
    )
  })

  return (
    <FlightsList
      flights={flights}
      extraHeaders={['Status']}
      title="Registered Flights"
    />
  )
}

export default Flights
