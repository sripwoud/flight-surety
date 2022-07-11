import React from 'react'
import { Header, Table } from 'semantic-ui-react'
import wretch from 'wretch'

import { formatDate } from '../../utils'

const STATUS_CODES = {
  0: 'Unknown',
  1: 'On time',
  2: 'Late Due to Airline',
  3: 'Late Due to Weather',
  4: 'Late Due to Technical Reason',
  5: 'Late Due to Other Reason'
}

const Flight = (props) => {
  const headerRow = [
    'Airline',
    'Ref',
    'From',
    'To',
    'Take Off',
    'Landing',
    'Price (ETH)',
    'Status'
  ]
  const renderBodyRow = (
    { airline, flightRef, from, to, takeOff, landing, price, statusCode },
    i
  ) => ({
    key: i,
    cells: [
      airline,
      flightRef,
      from,
      to,
      formatDate(new Date(takeOff)),
      formatDate(new Date(landing)),
      price,
      STATUS_CODES[statusCode]
    ]
  })
  return (
    <>
      <Header>Flight</Header>
      <Table
        compact
        textAlign="center"
        celled
        headerRow={headerRow}
        tableData={[props]}
        renderBodyRow={renderBodyRow}
      />
    </>
  )
}

Flight.getInitialProps = async ({ query: { key } }) =>
  wretch(`http://localhost:3001/flight/${key}`).get().json()

export default Flight
