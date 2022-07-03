import { Button, Header, Form, Select } from 'semantic-ui-react'

const flights = [
  { key: '1', text: 'ABC - TO - DATE', value: 'abc' },
  { key: '2', text: 'XYZ - TO - DATE', value: 'female' }
]
const AirlineForm = () => {
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
        />
        <Button type="submit">Book</Button>
      </Form>
    </>
  )
}

export default AirlineForm
