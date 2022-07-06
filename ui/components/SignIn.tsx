import React, { FC } from 'react'
import { Button } from 'semantic-ui-react'
import { useEthers } from '@usedapp/core'

const SignIn: FC = () => {
  const { account, activateBrowserWallet, deactivate } = useEthers()
  const props = account
    ? { icon: 'sign-out', onClick: deactivate }
    : { icon: 'sign-in', onClick: activateBrowserWallet }

  return <Button {...props} />
}

export default SignIn
