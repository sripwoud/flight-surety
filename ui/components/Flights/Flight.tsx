import { utils } from 'ethers'
import React, { ChangeEvent, FC, useState } from 'react'
import { Button, Checkbox, Input, Table } from 'semantic-ui-react'

import { FlightProps } from '../../types'

const formatDate = (date: Date) => {
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

const Flight: FC<{ flightProps: FlightProps; key: number }> = ({
  key,
  flightProps: flightProps
}) => {
  const { flightRef, from, to, price, takeOff, landing } = flightProps

  const [withInsurance, setWithInsurance] = useState(false)
  const [amount, setAmount] = useState<number>(0)

  const handleToggleInsurance = () => {
    setWithInsurance(!withInsurance)
  }
  const handleAmount = (event: ChangeEvent<HTMLInputElement>) => {
    setAmount(+event.target.value)
  }

  // const { send: book } = useContractFunction(
  //   { contract: app, method: 'book', args: [] },
  //   { value: flight.price.add(utils.parseEther(amount.toString())) }
  // )
  const handleBookPress = async () => {
    // const [flightRef, to, landing] = flight!.split('-').map((e) => e.trim())
    // return appContract.book(flightRef, to, landing)
  }

  return (
    <Table.Row key={key}>
      <Table.Cell>{flightRef}</Table.Cell>
      <Table.Cell>{from}</Table.Cell>
      <Table.Cell>{to}</Table.Cell>
      <Table.Cell>{formatDate(takeOff)}</Table.Cell>
      <Table.Cell>{formatDate(landing)}</Table.Cell>
      <Table.Cell>{utils.formatEther(price)}</Table.Cell>
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
            min="0"
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
    </Table.Row>
  )
}

export default Flight
