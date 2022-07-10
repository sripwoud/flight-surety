import { utils } from 'ethers'
import { useState, useEffect } from 'react'
import wretch from 'wretch'
import { useEthers } from '@usedapp/core'

import { FlightProps } from '../types'
import { data } from '../contracts'

const useFlights = (paxAddress?: string) => {
  const [flights, setFlights] = useState<FlightProps[]>([])

  const { library } = useEthers()

  useEffect(() => {
    const fetchFlights = async () => {
      let flights = await wretch(
        `${process.env.SERVER_URL || 'http://localhost:3001'}/flights`
      )
        .get()
        .json((flights) => Object.values(flights))

      if (paxAddress && library) {
        flights = await Promise.all(
          flights.map(async ({ flightRef, to, landing, key, ...rest }) => {
            let paxOnFlight = false

            try {
              paxOnFlight = await data
                .connect(library)
                .paxOnFlight(key, paxAddress)
            } catch (e) {
              console.log(e)
            }

            return { flightRef, to, landing, paxOnFlight, key, ...rest }
          })
        )
      }

      setFlights(
        flights.map(({ price, takeOff, landing, ...rest }) => ({
          ...rest,
          price: utils.parseEther(price),
          takeOff: new Date(takeOff),
          landing: new Date(landing)
        }))
      )
    }

    fetchFlights()
  }, [library, paxAddress])

  return flights
}

export { useFlights }
