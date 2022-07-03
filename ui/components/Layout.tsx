import React, { FC } from 'react'
import { Container } from 'semantic-ui-react'

import Footer from './Footer'
import Header from './Header'

type Props = {
  children: JSX.Element
}

const Layout: FC<Props> = (props) => {
  return (
    <Container>
      <Header />
      <div>{props.children}</div>
      <Footer />
    </Container>
  )
}

export default Layout
