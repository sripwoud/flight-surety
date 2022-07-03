import React, { FC } from 'react'
import { Container, Segment } from 'semantic-ui-react'

import Footer from './Footer'
import Header from './Header'

type Props = {
  children: JSX.Element
}

const Layout: FC<Props> = (props) => {
  return (
    <Container>
      <Header />
      <Segment>{props.children}</Segment>
      <Footer />
    </Container>
  )
}

export default Layout
