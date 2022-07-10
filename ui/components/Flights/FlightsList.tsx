import React, { FC } from 'react'
import { Header, Icon, Table } from 'semantic-ui-react'

const FLightsList: FC<{
  booked?: boolean
  title: string
  extraHeaders: string[]
  flights: JSX.Element[]
}> = ({ flights, title, extraHeaders }) => {
  const headers = ['From', 'To', 'Take Off', 'Landing', 'ETH', ...extraHeaders]

  return (
    <>
      <Header>{title}</Header>

      {!!flights.length ? (
        <Table compact celled definition selectable textAlign="center">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell />
              {headers.map((header, key) => (
                <Table.HeaderCell key={key}>
                  {header === 'ETH' ? <Icon name="ethereum" /> : header}
                </Table.HeaderCell>
              ))}
            </Table.Row>
          </Table.Header>

          <Table.Body>{flights}</Table.Body>
        </Table>
      ) : (
        'None'
      )}
    </>
  )
}
export default FLightsList
