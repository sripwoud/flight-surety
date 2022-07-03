import { Button, Header, Form, Input, Segment, Icon } from 'semantic-ui-react'

const registered = true
const AirlineForm = () => {
  return (
    <>
      <Segment>
        <Header>Consortium</Header>
        <Form>
          {registered ? (
            <>
              <Form.Field>
                <label>New Airline address</label>
                <input placeholder="0x..." />
              </Form.Field>
              <Button type="submit">Vote for Airline to Join</Button>
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
          <Form.Group widths="equal">
            <Form.Field>
              <label>Reference</label>
              <Input fluid placeholder="ABC123" />
            </Form.Field>
            <Form.Field>
              <label>From</label>
              <Input fluid placeholder="City" />
            </Form.Field>
            <Form.Field>
              <label>To</label>
              <Input fluid placeholder="City" />
            </Form.Field>
            <Form.Field>
              <label>Take Off</label>
              <Input fluid type="datetime-local" />
            </Form.Field>
            <Form.Field>
              <label>Landing</label>
              <Input fluid type="datetime-local" />
            </Form.Field>
          </Form.Group>
          <Button type="submit">Register</Button>
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
