import { utils } from 'ethers'
import React, { ChangeEvent, FC, useState } from 'react'
import { Button, Checkbox, Input, Table } from 'semantic-ui-react'

import { FlightProps } from '../../types'
import { app } from '../../contracts'
import { useContractFunction } from '@usedapp/core'

const formatDate = (date: Date) => {
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

const Flight: FC<{
  flightProps: FlightProps
  key: number
  forOracle?: boolean
}> = ({ key, flightProps: flightProps, forOracle }) => {
  const { flightRef, from, to, price, takeOff, landing, paxOnFlight } =
    flightProps

  const [withInsurance, setWithInsurance] = useState(false)
  const [amount, setAmount] = useState<number>(0.01)

  const handleToggleInsurance = () => {
    setWithInsurance(!withInsurance)
  }
  const handleAmount = (event: ChangeEvent<HTMLInputElement>) => {
    setAmount(+event.target.value)
  }

  const { send: book } = useContractFunction(app, 'book')
  const handleBookPress = () => {
    const insuranceAmount = utils.parseEther(amount.toString())

    book(flightRef, to, landing.getTime(), insuranceAmount, {
      value: price.add(insuranceAmount)
    })
  }

  const { send: fetchFlightStatus } = useContractFunction(
    app,
    'fetchFlightStatus'
  )
  const handleAskPress = () => {
    fetchFlightStatus(flightRef, to, landing.getTime())
  }

  return (
    <Table.Row key={key}>
      <Table.Cell>{flightRef}</Table.Cell>
      <Table.Cell>{from}</Table.Cell>
      <Table.Cell>{to}</Table.Cell>
      <Table.Cell>{formatDate(takeOff)}</Table.Cell>
      <Table.Cell>{formatDate(landing)}</Table.Cell>
      <Table.Cell>{utils.formatEther(price)}</Table.Cell>
      {forOracle ? (
        <Table.Cell collapsing>
          <Button onClick={handleAskPress}>Ask Status</Button>
        </Table.Cell>
      ) : (
        !paxOnFlight && (
          <>
            <Table.Cell collapsing>
              <Checkbox
                slider
                onChange={handleToggleInsurance}
                checked={withInsurance}
                style={{ marginRight: '10px' }}
              />
              {withInsurance && (
                <Input
                  icon="ethereum"
                  type="number"
                  min="0.001"
                  max={1}
                  step={0.01}
                  value={amount}
                  onChange={handleAmount}
                />
              )}
            </Table.Cell>
            <Table.Cell collapsing>
              <Button onClick={handleBookPress}>Book</Button>
            </Table.Cell>
          </>
        )
      )}
    </Table.Row>
  )
}

export default Flight
