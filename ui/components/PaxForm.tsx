import { Divider } from 'semantic-ui-react'

import FLightsList from './Flights/FlightListForPax'

const PaxForm = () => {
  return (
    <>
      <FLightsList title="Book Flight" />
      <Divider />
      <FLightsList booked title="Booked Fights" />
    </>
  )
}

export default PaxForm
