import { utils } from 'ethers'
import React, { FC } from 'react'
import { Table } from 'semantic-ui-react'

import { FlightProps } from '../../types'
import { formatDate } from '../../utils'

const Flight: FC<{
  flightProps: FlightProps
  children?: React.ReactNode
}> = ({ flightProps: flightProps, children }) => {
  const { key, flightRef, from, to, price, takeOff, landing } = flightProps

  return (
    <Table.Row key={key}>
      <Table.Cell>{flightRef}</Table.Cell>
      <Table.Cell>{from}</Table.Cell>
      <Table.Cell>{to}</Table.Cell>
      <Table.Cell>{formatDate(takeOff)}</Table.Cell>
      <Table.Cell>{formatDate(landing)}</Table.Cell>
      <Table.Cell>{utils.formatEther(price)}</Table.Cell>
      {children}
    </Table.Row>
  )
}

export default Flight
