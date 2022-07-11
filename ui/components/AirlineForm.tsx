import { Button, Header, Form, Segment, Icon } from 'semantic-ui-react'
import { useState } from 'react'
import { utils } from 'ethers'
import { useContractFunction, useEthers } from '@usedapp/core'
import { app } from '../contracts'
import { useCanRegister, useHasFunded } from '../hooks'

const AirlineForm = () => {
  const [newAirlineAddress, setNewAirlineAddress] = useState('')

  const [fundingAmount, setFundingAmount] = useState('10')
  const [flightRef, setFlightRef] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [departure, setDeparture] = useState<number>()
  const [landing, setLanding] = useState<number>()
  const [price, setPrice] = useState('0')

  const { account } = useEthers()
  const hasFunded = useHasFunded(account)
  const canRegisterAirline = useCanRegister(account)
  const canRegisterFlight =
    flightRef && from && to && departure && landing && price

  const { send: fund } = useContractFunction(app, 'fund')
  const { send: registerAirline } = useContractFunction(app, 'registerAirline')
  const { send: registerFlight } = useContractFunction(app, 'registerFlight')
  const { send: withdraw } = useContractFunction(app, 'withdraw')

  return (
    <>
      <Segment>
        <Header>Consortium</Header>
        <Form>
          {!hasFunded && (
            <>
              <Form.Input
                label="Funding Amount (ETH)"
                fluid
                type="number"
                min="10"
                step="0.1"
                onChange={(e) => setFundingAmount(e.target.value)}
                value={fundingAmount}
              />
              <Button
                type="submit"
                onClick={() =>
                  fund({ value: utils.parseEther(fundingAmount) })
                }>
                <Icon name="ethereum"></Icon>
                Join
              </Button>
            </>
          )}
          {hasFunded && !canRegisterAirline && <p>Not Registerer Yet</p>}
          {canRegisterAirline && (
            <>
              <Form.Input
                label="New Airline address"
                placeholder="0x..."
                onChange={(e) => setNewAirlineAddress(e.target.value)}
              />
              {newAirlineAddress && (
                <Button
                  type="submit"
                  onClick={() => registerAirline(newAirlineAddress)}>
                  Vote for Airline to Join
                </Button>
              )}
            </>
          )}
        </Form>
      </Segment>
      <Segment>
        <Header>Flight</Header>
        <Form>
          <Form.Group>
            <Form.Input
              label="Reference"
              fluid
              placeholder="ABC123"
              onChange={(e) => setFlightRef(e.target.value)}
              width={3}
              value={flightRef}
            />
            <Form.Input
              label="From"
              width={3}
              fluid
              placeholder="City"
              onChange={(e) => setFrom(e.target.value)}
              value={from}
            />
            <Form.Input
              label="To"
              width={3}
              fluid
              placeholder="City"
              onChange={(e) => setTo(e.target.value)}
              value={to}
            />
            <Form.Input
              label="Take Off"
              width={3}
              fluid
              type="datetime-local"
              onChange={(e) => setDeparture(new Date(e.target.value).getTime())}
            />
            <Form.Input
              label="Landing"
              width={3}
              fluid
              type="datetime-local"
              onChange={(e) => setLanding(new Date(e.target.value).getTime())}
            />
            <Form.Input
              label="Price (ETH)"
              width={2}
              fluid
              type="number"
              min="0"
              step="0.001"
              onChange={(e) => setPrice(e.target.value)}
              value={price}
            />
          </Form.Group>
          {canRegisterFlight && (
            <Button
              type="submit"
              onClick={() =>
                registerFlight(
                  departure,
                  landing,
                  flightRef,
                  utils.parseEther(price),
                  from,
                  to
                )
              }>
              Register
            </Button>
          )}
        </Form>
      </Segment>
      <Segment>
        <Header>Tickets</Header>
        <Form>
          <Button type="submit" onClick={() => withdraw()}>
            <Icon name="ethereum"></Icon>
            Withdraw Earnings
          </Button>
        </Form>
      </Segment>
    </>
  )
}

export default AirlineForm
