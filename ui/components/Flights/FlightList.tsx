import React from 'react'
import { Icon, Table } from 'semantic-ui-react'

import Flight from './Flight'

import { useFlights } from '../../hooks'

const FLightsList = () => {
  const Flights = useFlights().map((flightProps, i) => (
    <Flight key={i} flightProps={flightProps} />
  ))

  return (
    <Table compact celled definition selectable textAlign="center">
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell />
          {['From', 'To', 'Take Off', 'Landing', 'ETH', 'Insurance', ''].map(
            (header, key) => (
              <Table.HeaderCell key={key}>
                {header === 'ETH' ? <Icon name="ethereum" /> : header}
              </Table.HeaderCell>
            )
          )}
        </Table.Row>
      </Table.Header>

      <Table.Body>{Flights}</Table.Body>
    </Table>
  )
}
export default FLightsList
