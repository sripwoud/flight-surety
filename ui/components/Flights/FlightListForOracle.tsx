import React, { FC } from 'react'
import { Header, Icon, Table } from 'semantic-ui-react'

import Flight from './Flight'

import { useFlights } from '../../hooks'

const FLightsList: FC<{
  booked?: boolean
  title: string
}> = ({ title }) => {
  const Flights = useFlights().map((flightProps, i) => {
    return <Flight key={i} flightProps={flightProps} forOracle />
  })

  const headers = ['From', 'To', 'Take Off', 'Landing', 'ETH']

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
