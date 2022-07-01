
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
        display('Oracles', 'Trigger oracles', [{ label: 'Fetch Flight Status', error: error, value: `${result.flight} ${result.timestamp}` }])
      })
    })

    // (airline) Register flight
    DOM.elid('register-flight').addEventListener('click', () => {
      const takeOff = new Date(DOM.elid('regFlightTakeOff').value).getTime()
      const landing = new Date(DOM.elid('regFlightLanding').value).getTime()
      const flight = DOM.elid('regFlightRef').value
      const price = DOM.elid('regFlightPrice').value
      contract.registerFlight(
        takeOff,
        landing,
        flight,
        price,
        (error, result) => {
          const times = `${new Date(result.takeOff).toString().slice(0, -42)} - ${new Date(result.landing).toString().slice(0, -42)}`
          display(`Airline ${result.address}`, 'Register Flight', [{
            label: 'Flight',
            error: error,
            value: `${result.flight} ${times}` }])
          let datalist = DOM.elid('flights')
          let option = DOM.option({ value: `${result.price} - ${times}` })
          datalist.appendChild(option)
        })
    })

    // Provide funding
    DOM.elid('fund').addEventListener('click', () => {
      let amount = DOM.elid('fundAmount').value
      contract.fund(amount, (error, result) => {
        display(`Airline ${result.address}`, 'Provide Funding', [{
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
