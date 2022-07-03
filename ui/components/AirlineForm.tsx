import { Button, Header, Form, Segment, Icon } from 'semantic-ui-react'
import { ChangeEvent, useState } from 'react'
import { BigNumber, utils } from 'ethers'

const registered = true
const AirlineForm = () => {
  const [newAirlineAddress, setNewAirlineAddress] = useState('')

  const [flightRef, setFlightRef] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [departure, setDeparture] = useState<number>()
  const [landing, setLanding] = useState<number>()
  const [price, setPrice] = useState<number>(0)

  const handleNewAddress = (event: ChangeEvent<HTMLInputElement>) => {
    // validate address
    setNewAirlineAddress(event.target.value)
  }
  const handleJoin = async () => {
    console.log('registerAirline', newAirlineAddress)
    // await appContract.registerAirline(newAirlineAddress)
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
    {
      setPrice(+event.target.value)
    }
  }
  const canRegister = flightRef && from && to && departure && landing && price
  const handleRegister = async () => {
    console.log('Register Flight', from, to, flightRef, landing, departure)
    // await appContract.registerFlight(departure, landing, flightRef, utils.parseEthers(price), from, to)
  }

  return (
    <>
      <Segment>
        <Header>Consortium</Header>
        <Form>
          {registered ? (
            <>
              <Form.Field>
                <label>New Airline address</label>
                <input placeholder="0x..." onChange={handleNewAddress} />
              </Form.Field>
              {newAirlineAddress && (
                <Button type="submit" onClick={handleJoin}>
                  Vote for Airline to Join
                </Button>
              )}
            </>
          ) : (
            <Button type="submit">
              <Icon name="ethereum"></Icon>
              Join
            </Button>
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
            />
            <Form.Input
              label="From"
              width={3}
              fluid
              placeholder="City"
              onChange={handleFrom}
            />
            <Form.Input
              label="To"
              width={3}
              fluid
              placeholder="City"
              onChange={handleTo}
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
            />{' '}
            <Form.Input
              label="Price (ETH)"
              width={2}
              fluid
              type="number"
              min="0"
              step="0.001"
              onChange={handlePrice}
            />
          </Form.Group>
          {canRegister && (
            <Button type="submit" onClick={handleRegister}>
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
