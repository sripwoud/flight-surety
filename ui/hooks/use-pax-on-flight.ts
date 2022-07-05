import { useCall } from '@usedapp/core'

import { data } from '../contracts'

const usePaxOnFlight = ({
  address,
  flightRef,
  to,
  landing
}: {
  address?: string
  flightRef: string
  to: string
  landing: string
}): boolean => {
  const { value, error } =
    useCall({
      contract: data,
      method: 'paxOnFlight',
      args: [flightRef, new Date(to).getTime(), landing, address]
    }) || {}

  return !(error || !value?.[0])
}

export { usePaxOnFlight }
