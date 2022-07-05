import React, { FC } from 'react'
import { Header, Icon, Table } from 'semantic-ui-react'

import Flight from './Flight'

import { useFlights } from '../../hooks'
import { useEthers } from '@usedapp/core'

const FLightsList: FC<{
  booked?: boolean
  title: string
}> = ({ booked = false, title }) => {
  const { account } = useEthers()
  const Flights = useFlights(account)
    .filter(({ paxOnFlight }) => paxOnFlight === booked)
    .map((flightProps, i) => <Flight key={i} flightProps={flightProps} />)

  const _headers = ['From', 'To', 'Take Off', 'Landing', 'ETH']
  const headers = booked
    ? [..._headers, 'Status', 'Claim']
    : [..._headers, 'Insurance', '']

  return (
    <>
      <Header>{title}</Header>

      {!!Flights.length ? (
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

          <Table.Body>{Flights}</Table.Body>
        </Table>
      ) : (
        'None'
      )}
    </>
  )
}
export default FLightsList
