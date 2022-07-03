import {useCall} from '@usedapp/core'

import {data} from '../contracts'

export const useHasFunded = (address?: string): boolean => {
  const { value, error } =
  useCall({
    contract: data,
    method: 'hasFunded',
    args: [address]
  }) || {}

  return !(error || !value?.[0])
}
