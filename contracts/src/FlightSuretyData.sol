pragma solidity ^0.4.25;

import 'oz/SafeMath.sol';

contract FlightSuretyData {
    using SafeMath for uint256;

    address private contractOwner;

    bool public operational = true;

    mapping(address => bool) public authorizedCallers;

    struct Airline {
        bool registered;
        bool funded;
    }

    mapping(address => Airline) public airlines;
    uint256 public registeredAirlinesCount;
    address public firstAirline;

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 takeOff;
        uint256 landing;
        address airline;
        string flightRef;
        uint256 price;
        string from;
        string to;
        mapping(address => bool) bookings;
        mapping(address => uint256) insurances;
    }

    mapping(bytes32 => Flight) public flights;
    bytes32[] public flightKeys;
    uint256 public indexFlightKeys = 0;

    /* Have to be out of the Flight struct type,
        otherwise can't use FLight constructor in the registerFLight function.
        (unlike mapping object, array argument can't be omitted)
      */
    address[] internal passengers;

    mapping(address => uint256) public withdrawals;

    event Paid(address recipient, uint256 amount);
    event Funded(address airline);
    event AirlineRegistered(address origin, address newAirline);
    event Credited(address passenger, uint256 amount);

    modifier requireIsOperational() {
        require(operational, 'Contract is currently not operational');
        _;
    }

    modifier requireContractOwner() {
        require(msg.sender == contractOwner, 'Caller is not contract owner');
        _;
    }

    modifier callerAuthorized() {
        require(
            authorizedCallers[msg.sender] == true,
            'Address not authorized to call this function'
        );
        _;
    }

    // To avoid spending gas trying to put the contract in a state it already is in
    modifier differentModeRequest(bool status) {
        require(status != operational, 'Contract already in the state requested');
        _;
    }

    modifier flightRegistered(bytes32 flightKey) {
        require(flights[flightKey].isRegistered, 'This flight does not exist');
        _;
    }

    modifier valWithinRange(
        uint256 val,
        uint256 low,
        uint256 up
    ) {
        require(val < up, 'Value higher than max allowed');
        require(val > low, 'Value lower than min allowed');
        _;
    }

    constructor(address _firstAirline) public {
        contractOwner = msg.sender;
        firstAirline = _firstAirline;
        registeredAirlinesCount = 1;
        airlines[firstAirline].registered = true;
    }

    // Fallback function for funding smart contract.
    function() external payable callerAuthorized {
        require(msg.data.length == 0);
        fund(msg.sender);
    }

    // do not process a flight more than once
    // which could e.g result in the passengers being credited their insurance amount twice.
    modifier notYetProcessed(bytes32 flightKey) {
        require(
            flights[flightKey].statusCode == 0,
            'This flight has already been processed'
        );
        _;
    }

    // When operational mode is disabled, all write transactions except for this one will fail
    function setOperatingStatus(bool mode)
    external
    requireContractOwner
    differentModeRequest(mode)
    {
        operational = mode;
    }

    // function to authorize addresses (especially the App contract) to call functions from flighSuretyData contract
    function authorizeCaller(address callerAddress)
    external
    requireContractOwner
    requireIsOperational
    {
        authorizedCallers[callerAddress] = true;
    }

    function hasFunded(address airlineAddress)
    external
    view
    returns (bool _hasFunded)
    {
        _hasFunded = airlines[airlineAddress].funded;
    }

    function isRegistered(address airlineAddress)
    external
    view
    returns (bool _registered)
    {
        _registered = airlines[airlineAddress].registered;
    }

    function getFlightPrice(bytes32 flightKey)
    external
    view
    returns (uint256 price)
    {
        price = flights[flightKey].price;
    }

    // add airline to the registration "queue"
    function registerAirline(address airlineAddress, address originAddress)
    external
    requireIsOperational
    callerAuthorized
    {
        registeredAirlinesCount++;
        airlines[airlineAddress].registered = true;
        emit AirlineRegistered(originAddress, airlineAddress);
    }

    function registerFlight(
        uint256 _takeOff,
        uint256 _landing,
        string _flight,
        uint256 _price,
        string _from,
        string _to,
        address originAddress
    ) external requireIsOperational callerAuthorized {
        require(_takeOff > now, 'A flight cannot take off in the past');
        require(_landing > _takeOff, 'A flight cannot land before taking off');

        Flight memory flight = Flight(
            true,
            0,
            _takeOff,
            _landing,
            originAddress,
            _flight,
            _price,
            _from,
            _to
        );
        bytes32 flightKey = getFlightKey(_flight, _from, _to, _takeOff);
        flights[flightKey] = flight;
        indexFlightKeys = flightKeys.push(flightKey).sub(1);
        // event emission in app contract
    }

    /**
     * @dev Passenger Buys insurance for a flight
   *
   */
    function book(
        bytes32 flightKey,
        uint256 amount,
        address originAddress
    )
    external
    payable
    requireIsOperational
    callerAuthorized
    flightRegistered(flightKey)
    {
        Flight storage flight = flights[flightKey];
        flight.bookings[originAddress] = true;
        flight.insurances[originAddress] = amount;
        passengers.push(originAddress);
        withdrawals[flight.airline] = flight.price;
    }

    // Transfers eligible payout funds to insuree or airline
    function pay(address originAddress)
    external
    requireIsOperational
    callerAuthorized
    {
        // Check-Effect-Interaction pattern to protect against re entrancy attack
        // Check
        require(
            withdrawals[originAddress] > 0,
            'No amount to be transferred to this address'
        );
        // Effect
        uint256 amount = withdrawals[originAddress];
        withdrawals[originAddress] = 0;
        // Interaction
        originAddress.transfer(amount);
        emit Paid(originAddress, amount);
    }

    function processFlightStatus(bytes32 flightKey, uint8 statusCode, uint8 claimableStatusCode)
    external
    flightRegistered(flightKey)
    requireIsOperational
    callerAuthorized
    notYetProcessed(flightKey)
    {
        Flight storage flight = flights[flightKey];
        flight.statusCode = statusCode;
        // 2 = "flight delay due to airline"
        if (statusCode == claimableStatusCode) {
            creditInsurees(flightKey);
        }
    }

    function getFlightKey(
        string flightRef,
        string from,
        string to,
        uint256 takeOff
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(flightRef, from, to, takeOff));
    }

    function paxOnFlight(bytes32 key, address passenger)
    public
    view
    returns (bool onFlight)
    {
        onFlight = flights[key].bookings[passenger];
    }

    function subscribedInsurance(bytes32 key, address passenger)
    public
    view
    returns (uint256 amount)
    {
        amount = flights[key].insurances[passenger];
    }

    // Initial funding for the insurance.
    // Unless there are too many delayed flights
    function fund(address originAddress)
    public
    payable
    requireIsOperational
    callerAuthorized
    {
        airlines[originAddress].funded = true;
        emit Funded(originAddress);
    }

    function creditInsurees(bytes32 flightKey)
    internal
    requireIsOperational
    flightRegistered(flightKey)
    {
        Flight storage flight = flights[flightKey];

        for (uint256 i = 0; i < passengers.length; i++) {
            withdrawals[passengers[i]] = flight.insurances[passengers[i]];
            emit Credited(passengers[i], flight.insurances[passengers[i]]);
        }
    }
}
