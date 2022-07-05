import React, { FC } from 'react'
import { Dropdown, Icon, Menu } from 'semantic-ui-react'
import Link from 'next/link'
import { useEthers } from '@usedapp/core'

import SignIn from './SignIn'
import { formatEthAddress } from '../utils'

const Header: FC = () => {
  const { account } = useEthers()

  return (
    <Menu attached="top">
      <Dropdown item icon="bars" simple>
        <Dropdown.Menu>
          <Dropdown.Item>
            <Icon name="dropdown" />
            <span className="text">Profile</span>

            <Dropdown.Menu>
              <Link href="airline">
                <Dropdown.Item>Airline</Dropdown.Item>
              </Link>
              <Link href="passenger">
                <Dropdown.Item>Passenger</Dropdown.Item>
              </Link>
              <Link href="oracle">
                <Dropdown.Item>Oracle</Dropdown.Item>
              </Link>
            </Dropdown.Menu>
          </Dropdown.Item>
          <Link href="flights">
            <Dropdown.Item>Flights</Dropdown.Item>
          </Link>
        </Dropdown.Menu>
      </Dropdown>

      {account && (
        <Menu.Menu>
          <Menu.Item>Connected with {formatEthAddress(account)}</Menu.Item>
        </Menu.Menu>
      )}

      <Menu.Menu position="right">
        <Link href="/">
          <Menu.Item name="Flight Surety"></Menu.Item>
        </Link>
        <Menu.Item>
          <SignIn />
        </Menu.Item>
      </Menu.Menu>
    </Menu>
  )
}

export default Header
