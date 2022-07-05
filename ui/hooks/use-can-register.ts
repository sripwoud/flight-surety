import { useHasFunded } from './use-has-funded'
import { useIsRegistered } from './use-is-registered'

export const useCanRegister = (address?: string): boolean => {
  const isRegistered = useIsRegistered(address)
  const hasFunded = useHasFunded(address)

  return isRegistered && hasFunded
}
