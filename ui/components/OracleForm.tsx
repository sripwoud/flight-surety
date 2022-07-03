import { Button, Header, Form, Select } from 'semantic-ui-react'
import { ChangeEvent, useState } from 'react'

const flights = [
  { key: '1', text: 'ABC - TO - DATE', value: 'abc' },
  { key: '2', text: 'XYZ - TO - DATE', value: 'xyz' }
]
const AirlineForm = () => {
  const [flight, setFlight] = useState('')

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFlight(event.target.innerText)
  }
  const handleClick = async () => {
    const [flightRef, to, landing] = flight!.split('-').map((e) => e.trim())
    // return appContract.fetchFlightStatus(flightRef, to, new Date(landing))
  }

  return (
    <>
      <Header>Flight Status</Header>
      <Form>
        <Form.Field
          control={Select}
          options={flights}
          // @ts-ignore
          label={{ children: 'Flight', htmlFor: 'form-select-control-flight' }}
          placeholder="Flight"
          search
          onChange={handleChange}
          searchInput={{ id: 'form-select-control-flight' }}
        />
        {flight && (
          <Button type="submit" onClick={handleClick}>
            Ask
          </Button>
        )}
      </Form>
    </>
  )
}

export default AirlineForm
