import React, { FC } from 'react'
import { Segment, Divider, Icon } from 'semantic-ui-react'

const Footer: FC = () => {
  return (
    <Divider horizontal>
      <Segment basic textAlign="center">
        <p>
          <a
            href="https://github.com/sripwoud/flight-surety"
            target="_blank"
            rel="noreferrer">
            <Icon name="github" size="large" color="black" />
          </a>
        </p>
        <p></p>
      </Segment>
    </Divider>
  )
}

export default Footer
