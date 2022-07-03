import { useHasFunded } from './airline-has-funded'
import { useIsRegisteredAirline } from './is-registered-airline'

export const useCanRegisterAirline = (address?: string): boolean => {
  const isRegistered = useIsRegisteredAirline(address)
  const hasFunded = useHasFunded(address)

  return isRegistered && hasFunded
}
