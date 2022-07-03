import { Button, Header, Form, Segment, Icon } from 'semantic-ui-react'
import { ChangeEvent, useState } from 'react'
import { utils } from 'ethers'
import { useContractFunction, useEthers } from '@usedapp/core'
import { app } from '../contracts'
import { useCanRegisterAirline, useHasFunded } from '../hooks'

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
  const canRegisterAirline = useCanRegisterAirline(account)

  const handleFundingAmount = (event: ChangeEvent<HTMLInputElement>) => {
    setFundingAmount(event.target.value)
  }
  const handleNewAddress = (event: ChangeEvent<HTMLInputElement>) => {
    // validate address
    setNewAirlineAddress(event.target.value)
  }

  const { send: fund } = useContractFunction(app, 'fund')
  const handleJoin = async () => {
    await fund({ value: utils.parseEther(fundingAmount) })
  }

  const { send: registerAirline } = useContractFunction(app, 'registerAirline')
  const handleRegisterAirline = async () => {
    await registerAirline(newAirlineAddress)
  }

  const handleFlightRef = (event: ChangeEvent<HTMLInputElement>) =>
    setFlightRef(event.target.value)
  const handleFrom = (event: ChangeEvent<HTMLInputElement>) =>
    setFrom(event.target.value)
  const handleTo = (event: ChangeEvent<HTMLInputElement>) =>
    setTo(event.target.value)
  const handleDeparture = (event: ChangeEvent<HTMLInputElement>) =>
    setDeparture(new Date(event.target.value).getTime())
  const handleLanding = (event: ChangeEvent<HTMLInputElement>) =>
    setLanding(new Date(event.target.value).getTime())
  const handlePrice = (event: ChangeEvent<HTMLInputElement>) => {
    setPrice(event.target.value)
  }

  const canRegisterFlight =
    flightRef && from && to && departure && landing && price
  const { send: registerFlight } = useContractFunction(app, 'registerFlight')
  const handleRegisterFlight = async () => {
    console.log('Register Flight', from, to, flightRef, landing, departure)
    await registerFlight(
      departure,
      landing,
      flightRef,
      utils.parseEther(price),
      from,
      to
    )
  }

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
                onChange={handleFundingAmount}
                value={fundingAmount}
              />
              <Button type="submit" onClick={handleJoin}>
                <Icon name="ethereum"></Icon>
                Join
              </Button>
            </>
          )}
          {hasFunded && !canRegisterAirline && <p>Not Registerer Yet</p>}
          {canRegisterAirline && (
            <>
              <Form.Field>
                <label>New Airline address</label>
                <input placeholder="0x..." onChange={handleNewAddress} />
              </Form.Field>
              {newAirlineAddress && (
                <Button type="submit" onClick={handleRegisterAirline}>
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
              onChange={handleFlightRef}
              width={3}
              value={flightRef}
            />
            <Form.Input
              label="From"
              width={3}
              fluid
              placeholder="City"
              onChange={handleFrom}
              value={from}
            />
            <Form.Input
              label="To"
              width={3}
              fluid
              placeholder="City"
              onChange={handleTo}
              value={to}
            />
            <Form.Input
              label="Take Off"
              width={3}
              fluid
              type="datetime-local"
              onChange={handleDeparture}
            />
            <Form.Input
              label="Landing"
              width={3}
              fluid
              type="datetime-local"
              onChange={handleLanding}
            />
            <Form.Input
              label="Price (ETH)"
              width={2}
              fluid
              type="number"
              min="0"
              step="0.001"
              onChange={handlePrice}
              value={price}
            />
          </Form.Group>
          {canRegisterFlight && (
            <Button type="submit" onClick={handleRegisterFlight}>
              Register
            </Button>
          )}
        </Form>
      </Segment>
      <Segment>
        <Header>Tickets</Header>
        <Form>
          <Button type="submit">
            <Icon name="ethereum"></Icon>
            Withdraw Earnings
          </Button>
        </Form>
      </Segment>
    </>
  )
}

export default AirlineForm
