import { utils } from 'ethers'
import React, { FC } from 'react'
import { Header, Icon, Table } from 'semantic-ui-react'

import { FlightProps } from '../../types'
import { useFlights } from '../../hooks'
import Link from 'next/link'

const formatDate = (date: Date) => {
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

const Flight: FC<{
  flightProps: FlightProps
}> = ({ flightProps: flightProps }) => {
  const { key, flightRef, from, to, price, takeOff, landing, statusCode } =
    flightProps

  return (
    <Link href={`/flights/[key]`} as={`/flights/${key}`}>
      <Table.Row key={key}>
        <Table.Cell>{flightRef}</Table.Cell>
        <Table.Cell>{from}</Table.Cell>
        <Table.Cell>{to}</Table.Cell>
        <Table.Cell>{formatDate(takeOff)}</Table.Cell>
        <Table.Cell>{formatDate(landing)}</Table.Cell>
        <Table.Cell>{utils.formatEther(price)}</Table.Cell>
        <Table.Cell>{statusCode}</Table.Cell>
      </Table.Row>
    </Link>
  )
}

const Flights: FC = () => {
  const _Flights = useFlights().map((flightProps) => {
    return <Flight key={flightProps.key} flightProps={flightProps} />
  })

  const headers = ['From', 'To', 'Take Off', 'Landing', 'ETH', 'Status']

  return (
    <>
      <Header>Registered Flights</Header>

      {!!_Flights.length ? (
        <Table compact celled definition selectable textAlign="center">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell />
              {headers.map((header, key) => (
                <Table.HeaderCell key={key}>
                  {header === 'ETH' ? <Icon name="ethereum" /> : header}
                </Table.HeaderCell>
              ))}
            </Table.Row>
          </Table.Header>

          <Table.Body>{_Flights}</Table.Body>
        </Table>
      ) : (
        'None'
      )}
    </>
  )
}

export default Flights
