pragma solidity ^0.4.25;

/* It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info:
https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/
*/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";


// FlightSuretyData Interface contract
contract FlightSuretyData {

    function registerAirline(address airlineAddress, address originAddress) external;

    function fund(address originAddress) external payable;

    function registerFlight
    (
        uint takeOff,
        uint landing,
        string light,
        uint price,
        string from,
        string to,
        address originAddress
    )
    external;
}


contract FlightSuretyApp {
    // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)
    using SafeMath for uint256;

    ///////////////////////////// APP VARIABLES
    /* Contract upgradability: app contract variables are separated from contract data variables.
    App variables might have to be updated or changed because of business rules changes.
    In this case a new updated App contract would be deployed.
    On the other hand, the linked Data contract isn't changed or redeployed.
    */

    // State var for data contract
    FlightSuretyData flightSuretyData;

    // minimum funding amount
    uint minFund = 10 ether;

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    // Account used to deploy contract
    address private contractOwner;
    // Contract control flag
    bool public operational;

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
    }
    /* mapping of flight moved to data contract:
    we don't want to loose previously registered flights in the case when deploying a new app contract
    */

    /////////////////////////////// EVENTS
    event FlightRegistered(string ref);

    /////////////////////////////// MODIFIERS

    // Contract "pausing" functionality
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        // All modifiers require an "_" which indicates where the function body will be added
        _;
    }

    // avoid spending unecessary gas if requested state changed if the same as the current one
    modifier differentModeRequest(bool status) {
        require(status != operational, "Contract already in the state requested");
        _;
    }

    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    // Part of app contract (business rule that might change)
    modifier enoughFund() {
        require(msg.value >= minFund, "Minimun funding amount is 10 ETH");
        _;
    }

    //////////////////////////////// CONSTRUCTOR

    constructor(address dataContractAddress) public {
        operational = true;
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(dataContractAddress);
    }

    //////////////////////////// UTILITY FUNCTIONS
    function setOperatingStatus(bool mode) external requireContractOwner
    differentModeRequest(mode)
    {
        operational = mode;
    }

    ///////////////////////////// SMART CONTRACT FUNCTIONS

    function registerAirline(address airlineAddress)
    external
    requireIsOperational
    {
        flightSuretyData.registerAirline(airlineAddress, msg.sender);
    }

    function fund()
    external
    enoughFund
    requireIsOperational
    payable
    {
        flightSuretyData.fund.value(msg.value)(msg.sender);
    }

    function registerFlight
    (
        uint _takeOff,
        uint _landing,
        string _flight,
        uint _price,
        string _from,
        string _to
    )
    external
    requireIsOperational
    {
        flightSuretyData.registerFlight(
            _takeOff,
            _landing,
            _flight,
            _price,
            _from,
            _to,
            msg.sender
        );
        emit FlightRegistered(_flight);
    }

   //Called after oracle has updated flight status
    function processFlightStatus
    (
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    )
    internal
    pure
    {
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
    (
        address airline,
        string flight,
        uint256 timestamp
    )
    external
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
            requester: msg.sender,
            isOpen: true
        });

        emit OracleRequest(index, airline, flight, timestamp);
    }

////////////////////// START ORACLE MANAGEMENT REGION
    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
        // This lets us group responses and identify
        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);

    // Register an oracle with the contract
    function registerOracle() external payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
            isRegistered: true,
            indexes: indexes
        });
    }

    function getMyIndexes() external view returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
    (
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp,
        uint8 statusCode
    )
    external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    function getFlightKey
    (
        address airline,
        string flight,
        uint256 timestamp
    )
    internal
    pure
    returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account) internal returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(blockhash(block.number - nonce++),
                    account)
                )
            ) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

//////////////////////// END ORACLE MANAGEMENT REGION

}
