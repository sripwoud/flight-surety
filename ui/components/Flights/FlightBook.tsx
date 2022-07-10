import { utils } from 'ethers'
import React, { FC, useState } from 'react'
import { Button, Checkbox, Input, Table } from 'semantic-ui-react'

import { FlightProps } from '../../types'
import Flight from './Flight'
import { app } from '../../contracts'
import { useContractFunction } from '@usedapp/core'

const FlightBook: FC<{
  flightProps: FlightProps
}> = ({ flightProps }) => {
  const { key, price } = flightProps

  const [withInsurance, setWithInsurance] = useState(false)
  const [amount, setAmount] = useState<number>(0.01)

  const { send: book } = useContractFunction(app, 'book')
  const handleBookPress = () => {
    const insuranceAmount = utils.parseEther(amount.toString())
    book(key, insuranceAmount, {
      value: price.add(insuranceAmount)
    })
  }

  return (
    <Flight flightProps={flightProps}>
      <Table.Cell collapsing>
        <Checkbox
          slider
          onChange={() => setWithInsurance(!withInsurance)}
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
            onChange={(e) => setAmount(+e.target.value)}
          />
        )}
      </Table.Cell>
      <Table.Cell collapsing>
        <Button onClick={handleBookPress}>Book</Button>
      </Table.Cell>
    </Flight>
  )
}

export default FlightBook
