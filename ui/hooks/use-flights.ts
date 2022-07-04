import { useState, useEffect } from 'react'
import wretch from 'wretch'

const useFlights = () => {
  const [flights, setFlights] = useState<Record<string, any>>([])

  useEffect(() => {
    const fetchFlights = async () => {
      const flights = await wretch('http://localhost:3001/flights').get().json()
      setFlights(flights)
    }

    fetchFlights()
  })

  return flights
}

export { useFlights }
