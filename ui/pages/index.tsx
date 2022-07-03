import type { NextPage } from 'next'
import { Item, Label, List } from 'semantic-ui-react'
import Link from 'next/link'

const Home: NextPage = () => {
  return (
    <Item.Group>
      <Item>
        <Item.Content>
          <Link href="airline">
            <Item.Header as="a">
              <Label icon="plane" content="Airline" />
            </Item.Header>
          </Link>
          <Item.Meta>Can</Item.Meta>
          <Item.Description>
            <List as="ol">
              <List.Item>Register other airlines.</List.Item>
              <List.Item>
                Register flights respecting following conditions (otherwise the
                transaction will be rejected):
                <List>
                  <List.Item>Take Off date must be in the future.</List.Item>
                  <List.Item>
                    Landing date must be later than take Off date.
                  </List.Item>
                </List>
              </List.Item>
              <List.Item>
                Withdraw amount credited to them following flight ticket
                purchases by passengers.
              </List.Item>
              <List.Item>
                Form a consortium governed according to the following rules:
                <List>
                  <List.Item>
                    Providing a funding of at least 10 ETH is required before
                    registering flights or airlines.
                  </List.Item>
                  <List.Item>
                    Starting from a number of 4 airlines registered, consensus
                    of 50% is required (votes of half of the registered
                    airlines) for new airline registration
                  </List.Item>
                  <List.Item>
                    Consensus is not required to register flights
                  </List.Item>
                </List>
              </List.Item>
            </List>
          </Item.Description>
        </Item.Content>
      </Item>
      <Item>
        <Item.Content>
          <Link href="passenger">
            <Item.Header as="a">
              <Label icon="user" content="Passenger" />
            </Item.Header>
          </Link>
          <Item.Meta>Can</Item.Meta>
          <Item.Description>
            <List as="ol">
              <List.Item>
                Book flights that have been registered by airlines.
              </List.Item>
              <List.Item>
                Subscribe insurance for an amount of up to 1 ETH.
              </List.Item>
            </List>
          </Item.Description>
          <Item.Extra>{`
          Insured passengers get reimbursed 1.5 x their insurance amount if a flight is delay due to airline's responsibility.
          This credited amount is not transferred automatically but has to be withdrawn by insurees.
          `}</Item.Extra>
        </Item.Content>
      </Item>
    </Item.Group>
  )
}

export default Home
