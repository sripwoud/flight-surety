pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";


contract FlightSuretyData {
    using SafeMath for uint8;

    //////////////////////// DATA VARIABLES

    // Account used to deploy contract
    address private contractOwner;
    // Blocks all state changes throughout the contract if false
    bool public operational = true;
    // List addresses allowed to call this contract
    mapping(address => bool) public authorizedCallers;

    // Airlines
    struct Airline {
        bool registered;
        bool funded;
    }

    mapping(address => Airline) public airlines;
    uint8 public registeredAirlinesCount;
    address public firstAirline;

    // Flights
    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 takeOff;
        uint256 landing;
        uint256 updatedTimestamp;
        address airline;
        string flight;
        uint price;
        string from;
        string to;
        mapping(address => bool) passengers;
    }

    mapping(bytes32 => Flight) public flights;

    // Insurances: list amount that can be be claimed by passenger
    mapping(address => uint) public claims;


    // Multi-party consensus
    address[] public multiCalls = new address[](0);

    ////////////////////////// EVENTS

    ///////////////////////// CONSTRUCTOR

    constructor(address _firstAirline) public {
        contractOwner = msg.sender;

        // register first airline at deployment
        firstAirline = _firstAirline;
        registeredAirlinesCount = 1;
        airlines[firstAirline].registered = true;
    }

    ////////////////////////// MODIFIERS
    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        // All modifiers require an "_" which indicates where the function body will be added
        _;
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    // restrict function calls to previously authorized addresses
    modifier callerAuthorized() {
        require(authorizedCallers[msg.sender] == true, "Address not authorized to call this function");
        _;
    }

    // To avoid spending gas trying to put the contract in a state it already is in
    modifier differentModeRequest(bool status) {
        require(status != operational, "Contract already in the state requested");
        _;
    }

    modifier airlineRegistered(address airlineAddress) {
        require(
            airlines[airlineAddress].registered == true,
            "Airline must be registered before being able to perform this action");
        _;
    }

    modifier airlineFunded(address airlineAddress) {
        require(
            airlines[airlineAddress].funded == true,
            "Airline must provide funding before being able to perform this action");
        _;
    }
    /////////////////////////// UTILITY FUNCTIONS
    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */

    function setOperatingStatus(bool mode) external requireContractOwner
    differentModeRequest(mode)
    {
        operational = mode;
    }

    // function to authorize addresses (especially the App contract!) to call functions from flighSuretyData contract
    function authorizeCaller(address callerAddress)
    external
    requireContractOwner
    requireIsOperational
    {
        authorizedCallers[callerAddress] = true;
    }

    function threshold() internal view returns (uint _threshold) {
        _threshold = registeredAirlinesCount.div(2);
    }

    function hasFunded(address airlineAddress)
    external
    view
    returns (bool _hasFunded)
    {
        _hasFunded = airlines[airlineAddress].funded;
    }

    //////////////////////// SMART CONTRACT FUNCTIONS
   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline
    (
        address airlineAddress,
        address originAddress
    )
    external
    requireIsOperational
    callerAuthorized
    airlineRegistered(originAddress) // redundant?
    airlineFunded(originAddress)
    returns (uint additionalVotesRequired)
    {
        // only first Airline can register a new airline when less than 4 airlines are registered
        if (registeredAirlinesCount < 4) {
            require(
                firstAirline == originAddress,
                "Less than 4 airlines registered: only first airline registered can register new ones");
            registeredAirlinesCount++;
            airlines[airlineAddress].registered = true;
        } else {
            // multi party consensus
            bool isDuplicate = false;
            for (uint i=0; i < multiCalls.length; i++) {
                if (multiCalls[i] == originAddress) {
                    isDuplicate = true;
                    break;
                }
            }
            require(!isDuplicate, "Caller cannot call this function twice");
            multiCalls.push(originAddress);
            if (multiCalls.length >= threshold()) {
                airlines[airlineAddress].registered = true;
                registeredAirlinesCount++;
                multiCalls = new address[](0);
            }
            additionalVotesRequired = threshold() - multiCalls.length;
        }
    }

    function registerFlight
    (
        uint _takeOff,
        uint _landing,
        string _flight,
        uint _price,
        string _from,
        string _to,
        address originAddress
    )
    external
    requireIsOperational
    callerAuthorized
    airlineFunded(originAddress)
    {
        require(_takeOff > now, "A flight cannot take off in the past");
        require(_landing > _takeOff, "A flight cannot land before taking off");

        Flight memory flight = Flight(
            true,
            0,
            _takeOff,
            _landing,
            now,
            originAddress,
            _flight,
            _price,
            _from,
            _to
        );
        bytes32 flightKey = keccak256(abi.encodePacked(_flight, _to, _landing));
        flights[flightKey] = flight;
        flights[flightKey].passengers[originAddress] = true;
        // event emission via app contract
    }


   /**
    * @dev Passenger Buys insurance for a flight
    *
    */
    function buy(address originAddress)
    external
    requireIsOperational
    callerAuthorized
    payable
    {
        claims[originAddress] = msg.value;
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees()
    external
    requireIsOperational
    view
    {
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay()
    external
    requireIsOperational
    view
    {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund(address originAddress)
    public
    requireIsOperational
    airlineRegistered(originAddress)
    callerAuthorized
    payable
    {
        airlines[originAddress].funded = true;
    }

    function getFlightKey
    (
        address airline,
        string memory flight,
        uint256 timestamp
    )
    internal
    pure
    returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external callerAuthorized payable
    {
        require(msg.data.length == 0);
        fund(msg.sender);
    }


}
