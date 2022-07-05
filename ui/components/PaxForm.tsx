import { Divider } from 'semantic-ui-react'

import FLightsList from './Flights/FlightList'

const PaxForm = () => {
  return (
    <>
      <FLightsList title="Book FLight" />
      <Divider />
      <FLightsList booked title="Booked Fights" />
    </>
  )
}

export default PaxForm
