import React, { FC } from 'react'
import { Segment, Divider, Icon } from 'semantic-ui-react'

const Footer: FC = () => {
  return (
    <Divider horizontal>
      <Segment basic textAlign="center">
        <p>
          <a
            href="https://github.com/r1oga/flight-surety"
            target="_blank"
            rel="noreferrer">
            <Icon name="github" size="large" color="black" />
          </a>
          -{' '}
          <a href="https://twitter.com/r1oga" target="_blank" rel="noreferrer">
            @r1oga
          </a>
        </p>
        <p></p>
      </Segment>
    </Divider>
  )
}

export default Footer
