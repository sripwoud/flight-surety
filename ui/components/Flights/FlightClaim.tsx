import React, { FC } from 'react'
import { Button, Table } from 'semantic-ui-react'

import { FlightProps } from '../../types'
import Flight from './Flight'
import { app } from '../../contracts'
import { useContractFunction } from '@usedapp/core'

const FlightClaim: FC<{
  flightProps: FlightProps
}> = ({ flightProps }) => {
  const { statusCode } = flightProps
  const { send: withdraw } = useContractFunction(app, 'withdraw')
  const handleClaimPress = () => {
    withdraw()
  }

  return (
    <Flight flightProps={flightProps}>
      <Table.Cell>{statusCode}</Table.Cell>
      {!['On time', 'unknown'].includes(statusCode) && (
        <Button onClick={handleClaimPress}>Claim</Button>
      )}
    </Flight>
  )
}

export default FlightClaim
