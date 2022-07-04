import { useCall } from '@usedapp/core'

import { data } from '../contracts'

export const useIsRegistered = (address?: string): boolean => {
  const { value, error } =
    useCall({
      contract: data,
      method: 'isRegistered',
      args: [address]
    }) || {}

  return !(error || !value?.[0])
}
