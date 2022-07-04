import { Button, Header, Form, Select, Radio } from 'semantic-ui-react'
import { ChangeEvent, useState } from 'react'
import { BigNumber, utils } from 'ethers'
import { useFlights } from '../hooks'

const PaxForm = () => {
  const [flight, setFlight] = useState<string>()
  const [withInsurance, setWithInsurance] = useState(false)
  const [amount, setAmount] = useState<number>(0)

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFlight(event.target.innerText)
  }
  const handleToggle = () => {
    setWithInsurance(!withInsurance)
  }
  const handleClick = async () => {
    const [flightRef, to, landing] = flight!.split('-').map((e) => e.trim())
    // return appContract.book(flightRef, to, landing)
  }
  const handleAmount = (event: ChangeEvent<HTMLInputElement>) => {
    setAmount(+event.target.value)
  }

  const flights = useFlights().map(({ flight: { flightRef, from, to } }) => ({
    key: flightRef,
    text: [flightRef, from, to].join('-'),
    value: flightRef
  }))

  const canBook = (!withInsurance && flight) || !!amount

  return (
    <>
      <Header>Book Flight</Header>
      <Form>
        <Form.Field
          control={Select}
          options={flights}
          // @ts-ignore
          label={{ children: 'Flight', htmlFor: 'form-select-control-flight' }}
          placeholder="Flight"
          search
          searchInput={{ id: 'form-select-control-flight' }}
          onChange={handleChange}
        />
        <Form.Group>
          {flight && (
            <Form.Field>
              <Radio
                label="Insurance"
                toggle
                checked={withInsurance}
                onChange={handleToggle}
              />
            </Form.Field>
          )}
          {flight && withInsurance && (
            <Form.Input
              label="Amount"
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={amount}
              onChange={handleAmount}
            />
          )}
        </Form.Group>
        {canBook && (
          <Button type="submit" onClick={handleClick}>
            Book
          </Button>
        )}
      </Form>
    </>
  )
}

export default PaxForm
