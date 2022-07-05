import { useState, useEffect } from 'react'
import wretch from 'wretch'
import { FlightProps } from '../types'

const useFlights = () => {
  const [flights, setFlights] = useState<FlightProps[]>([])

  useEffect(() => {
    const fetchFlights = async () => {
      const flights = await wretch('http://localhost:3001/flights').get().json()

      setFlights(
        flights.map(({ flight }) => ({
          ...flight,
          takeOff: new Date(flight.takeOff),
          landing: new Date(flight.landing)
        }))
      )
    }

    fetchFlights()
  }, [])

  return flights
}

export { useFlights }
