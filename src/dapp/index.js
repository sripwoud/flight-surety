
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

    // User-submitted transaction
    // Submit oracle request
    DOM.elid('submit-oracle').addEventListener('click', () => {
      const flight = DOM.elid('flight-number').value
      // Write transaction
      contract.fetchFlightStatus(flight, (error, result) => {
        display('Oracles', 'Triggered oracles', [{ label: 'Fetch Flight Status', error: error, value: `${result.flight} ${result.timestamp}` }])
      })
    })

    // (airline) Register airline
    DOM.elid('register-airline').addEventListener('click', async () => {
      const newAirline = DOM.elid('regAirlineAddress').value
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
      const { address, error } = await contract.registerFlight(
        takeOff,
        landing,
        flightRef,
        price,
        from,
        to)
      const textNoPrice = `${from} - ${to}: ${new Date(takeOff).toString().slice(0, -42)} - ${new Date(landing).toString().slice(0, -42)}`
      display(
        `Airline ${sliceAddress(address)}`,
        'Register Flight', [{
          label: `${flightRef}`,
          error: error,
          value: `${textNoPrice}` }])

      // Append
      if (!error) {
        const flight = await contract.getFlight(flightRef, to, landing)
        // append flight to passenger selection list
        let datalist = DOM.elid('flights')
        let option = DOM.option({ value: `${price} ETH - ${textNoPrice}` })
        datalist.appendChild(option)
        // append to oracle submission list
        datalist = DOM.elid('oracle-requests')
        option = DOM.option({ value: `${flightRef} - ${to} - ${landing}` })
        datalist.appendChild(option)
      } else {
        console.error('Flight was not appended to selection lists')
      }
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
