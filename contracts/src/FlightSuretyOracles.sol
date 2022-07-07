pragma solidity ^0.4.25;

import 'oz/SafeMath.sol';

// FlightSuretyData Interface contract
contract FlightSuretyData {
    function processFlightStatus(bytes32 flightKey, uint8 status, uint8 claimableStatusCode) external;
}

contract FlightSuretyOracles {
    using SafeMath for uint256;

    FlightSuretyData flightSuretyData;

    address private contractOwner;

    uint8 private claimableStatusCode = 2;


    ////// ORACLES
    // Fee to be paid when registering oracle
    //  uint256 public constant REGISTRATION_FEE = 0 ether;

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Number of oracles that must respond for valid status
    uint8 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester; // Account that requested status
        bool isOpen; // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses; // Mapping key is the status code reported
        // This lets us group responses and identify
        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(flight, destination, timestamp)
    mapping(bytes32 => ResponseInfo) public oracleResponses;

    event OracleRegistered(uint8[3] indexes);
    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, bytes32 key);
    // Event fired each time an oracle submits a response
    event OracleReport(bytes32 key, uint8 status);
    event FlightProcessed(bytes32 key, uint8 statusCode);
    // Event fired when number of identical responses reaches the threshold: response is accepted and is processed
    event FlightStatusInfo(bytes32 key, uint8 status);

    modifier requireContractOwner() {
        require(msg.sender == contractOwner, 'Caller is not contract owner');
        _;
    }

    constructor(address dataContractAddress) public {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(dataContractAddress);
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(bytes32 key) external {
        uint8 index = getRandomIndex(msg.sender);
        oracleResponses[key] = ResponseInfo({
        requester : msg.sender,
        isOpen : true
        });
        emit OracleRequest(index, key);
    }

    // Register an oracle with the contract
    function registerOracle() external {
        // Require registration fee
        // require(msg.value >= REGISTRATION_FEE, 'Registration fee is required');

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered : true, indexes : indexes});
        emit OracleRegistered(indexes);
    }

    function getMyIndexes() external view returns (uint8[3]) {
        require(oracles[msg.sender].isRegistered, 'Not registered as an oracle');
        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(
        uint8 index,
        bytes32 key,
        uint8 statusCode
    ) external {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
            (oracles[msg.sender].indexes[1] == index) ||
            (oracles[msg.sender].indexes[2] == index),
            'Index does not match oracle request'
        );

        require(
            oracleResponses[key].isOpen,
            'Flight or timestamp do not match oracle request. Or request is closed (enough responses received)'
        );

        oracleResponses[key].responses[statusCode].push(msg.sender);
        emit OracleReport(key, statusCode);

        /* Information isn't considered verified until at least
            MIN_RESPONSES oracles respond with the *** same *** information
            */
        if (oracleResponses[key].responses[statusCode].length == MIN_RESPONSES) {
            // close responseInfo
            oracleResponses[key].isOpen = false;
            emit FlightStatusInfo(key, statusCode);
            // Handle flight status as appropriate
            processFlightStatus(key, statusCode);
        }
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account) internal returns (uint8[3]) {
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
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(
            uint256(
                keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))
            ) % maxValue
        );

        if (nonce > 250) {
            nonce = 0;
            // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

    //Called after oracle has updated flight status
    function processFlightStatus(bytes32 key, uint8 statusCode)
    internal
    {
        flightSuretyData.processFlightStatus(key, statusCode, claimableStatusCode);
        emit FlightProcessed(key, statusCode);
    }

    function setClaimableStatusCode(uint8 newStatusCode) private requireContractOwner {
        claimableStatusCode = newStatusCode;
    }
}
