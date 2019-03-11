
import DOM from './dom'
import Contract from './contract'
import './flightsurety.css'


(async () => {
  let result = null

  let contract = new Contract('localhost', () => {
    // Read transaction
    contract.isOperational((error, result) => {
      // console.log(error, result)
      display('Operational Status', 'Check if contract is operational', [{ label: 'Operational Status', error: error, value: result }])
    })

    // fetch list of registered flights from server and add them to selection forms
    function fetchAndAppendFlights () {
      fetch('http://localhost:3000/flights')
        .then(res => {
          return res.json()
        })
        .then(flights => {
          flights.forEach(flight => {
            // append only flights that haven't been processed yet
            if (flight.flight.statusCode == 0) {
              let {
                index,
                flight: { price, flightRef, from, to, takeOff, landing }
              } = flight
              price = price / 1000000000000000000
              // append flight to passenger selection list
              let datalist = DOM.elid('flights')
              let option = DOM.option({ value: `${index} - ${price} ETH - ${flightRef} - ${from} - ${parseDate(+takeOff)} - ${to} - ${parseDate(+landing)}` })
              datalist.appendChild(option)
              // append to oracle submission list
              datalist = DOM.elid('oracle-requests')
              option = DOM.option({ value: `${flightRef} - ${to} - ${parseDate(+landing)}` })
              datalist.appendChild(option)
            }
          })
        })
    }
    fetchAndAppendFlights()

    // User-submitted transaction
    // Submit oracle request
    DOM.elid('submit-oracle').addEventListener('click', async () => {
      // destructure
      let input = DOM.elid('oracle-request').value
      input = input.split('-')
      input = input.map(el => { return el.trim() })
      let [flight, destination, landing] = input
      landing = new Date(landing).getTime()
      // Write transaction
      await contract.fetchFlightStatus(flight, destination, landing)
    })

    // (airline) Register airline
    DOM.elid('register-airline').addEventListener('click', async () => {
      const newAirline = DOM.elid('regAirlineAddress').value
      await contract.registerAirline(newAirline)
      const { address, votes, error } = await contract.registerAirline(newAirline)
      display(
        `Airline ${sliceAddress(address)}`,
        'Register Airline', [{
          label: sliceAddress(newAirline),
          error: error,
          value: `${votes} more vote(s) required`
        }]
      )
    })

    // (airline) Register flight
    DOM.elid('register-flight').addEventListener('click', async () => {
      const takeOff = new Date(DOM.elid('regFlightTakeOff').value).getTime()
      const landing = new Date(DOM.elid('regFlightLanding').value).getTime()
      const flightRef = DOM.elid('regFlightRef').value
      const price = DOM.elid('regFlightPrice').value
      const from = DOM.elid('regFlightFrom').value
      const to = DOM.elid('regFlightTo').value
      await contract.registerFlight(
        takeOff,
        landing,
        flightRef,
        price,
        from,
        to)
    })

    // Provide funding
    DOM.elid('fund').addEventListener('click', () => {
      let amount = DOM.elid('fundAmount').value
      contract.fund(amount, (error, result) => {
        display(`Airline ${sliceAddress(result.address)}`, 'Provide Funding', [{
          label: 'Funding',
          error: error,
          value: `${result.amount} ETH` }])
      })
    })

    // Book flight
    DOM.elid('buy').addEventListener('click', async () => {
      // destructure and get index
      let input = DOM.elid('buyFlight').value
      input = input.split('-')
      input = input.map(el => { return el.trim() })
      const index = input[0]
      const insurance = DOM.elid('buyAmount').value
      // Fetch args from server
      fetch('http://localhost:3000/flights')
        .then(res => { return res.json() })
        .then(flights => {
          return flights.filter(el => { return el.index == index })
        })
        .then(async flight => {
          // These are all STRINGS
          const { flight: { flightRef, to, landing, price } } = flight[0]
          // execute transaction
          const { passenger, error } = await contract.book(
            flightRef,
            to,
            landing,
            price / 1000000000000000000,
            insurance)
          display(
            `Passenger ${sliceAddress(passenger)}`,
            'Book flight',
            [{
              label: `${flightRef} to ${to} lands at ${landing}`,
              error: error,
              value: `insurance: ${insurance} ETH`
            }]
          )
        })
    })

    // Withdraw funds
    DOM.elid('pay').addEventListener('click', () => {
      try {
        contract.withdraw()
      } catch (error) {
        console.log(error.message)
      }
    })
  })
})()

function display (title, description, results) {
  let displayDiv = DOM.elid('display-wrapper')
  let section = DOM.section()
  section.appendChild(DOM.h5(title))
  section.appendChild(DOM.span(description))
  results.map((result) => {
    let row = section.appendChild(DOM.div({ className: 'row' }))
    row.appendChild(DOM.span({ className: 'col-sm-4 field' }, result.label))
    row.appendChild(DOM.span({ className: 'col-sm-8 field-value' }, result.error ? String(result.error) : String(result.value)))
    section.appendChild(row)
  })
  displayDiv.append(section)
}

function sliceAddress (address) {
  return `${address.slice(0, 5)}...${address.slice(-3)}`
}

function parseDate(dateNum) {
  return new Date(dateNum).toString().slice(0, -42)
}
