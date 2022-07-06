pragma solidity ^0.4.25;

/* It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info:
https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/
*/

import 'oz/SafeMath.sol';

// FlightSuretyData Interface contract
contract FlightSuretyData {
  function registerAirline(address airlineAddress, address originAddress)
    external;

  function fund(address originAddress) external payable;

  function registerFlight(
    uint256 takeOff,
    uint256 landing,
    string flightRef,
    uint256 price,
    string from,
    string to,
    address originAddress
  ) external;

  function book(
    bytes32 flightKey,
    uint256 amount,
    address originAddress
  ) external payable;

  function pay(address originAddress) external;

  function processFlightStatus(bytes32 flightKey, uint8 status) external;

  function getFlightPrice(bytes32 flightKey) external view returns (uint256);

  function hasFunded(address airlineAddress) external view returns (bool);

  function isRegistered(address airlineAddress) external view returns (bool);

  function registeredAirlinesCount() external view returns (uint256);

  function firstAirline() external view returns (address);

  function paxOnFlight(bytes32 key, address passenger)
    public
    view
    returns (bool onFlight);
}

contract FlightSuretyApp {
  using SafeMath for uint256;

  FlightSuretyData flightSuretyData;

  address private contractOwner;

  uint256 public minFund = 0.1 ether;

  bool public operational;

  uint8 private constant STATUS_CODE_UNKNOWN = 0;
  uint8 private constant STATUS_CODE_ON_TIME = 1;
  uint8 private constant STATUS_CODE_LATE_AIRLINE = 2;
  uint8 private constant STATUS_CODE_LATE_WEATHER = 3;
  uint8 private constant STATUS_CODE_LATE_TECHNICAL = 4;
  uint8 private constant STATUS_CODE_LATE_OTHER = 5;

  // Multi-party consensus - votes count for to-be-added airline
  mapping(address => address[]) internal votes;

  event FlightRegistered(
    string flightRef,
    string from,
    string to,
    uint256 takeOff
  );
  event WithdrawRequest(address recipient);
  event FlightProcessed(bytes32 key, uint8 statusCode);

  ////// ORACLES
  // Fee to be paid when registering oracle
  uint256 public constant REGISTRATION_FEE = 0 ether;

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

  // Event fired each time an oracle submits a response
  event OracleReport(bytes32 key, uint8 status);
  // Event fired when number of identical responses reaches the threshold: response is accepted and is processed
  event FlightStatusInfo(bytes32 key, uint8 status);

  // Event fired when flight status request is submitted
  // Oracles track this and if they have a matching index
  // they fetch data and submit a response
  event OracleRequest(uint8 index, bytes32 key);

  modifier requireIsOperational() {
    require(operational, 'Contract paused');
    _;
  }

  // avoid spending unnecessary gas if requested state changed if the same as the current one
  modifier differentModeRequest(bool status) {
    require(status != operational, 'Contract already in the state requested');
    _;
  }

  modifier requireContractOwner() {
    require(msg.sender == contractOwner, 'Caller is not contract owner');
    _;
  }

  modifier enoughFund() {
    require(msg.value >= minFund, 'Value below minFund (0.1 ETH)');
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

  modifier paidEnough(uint256 _price) {
    require(msg.value >= _price, 'Value does not cover the price');
    _;
  }

  modifier checkValue(uint256 _price) {
    uint256 amountToReturn = msg.value - _price;
    msg.sender.transfer(amountToReturn);
    _;
  }

  modifier airlineRegistered() {
    require(
      flightSuretyData.isRegistered(msg.sender),
      'Sender must be a registered airline'
    );
    _;
  }

  modifier airlineFunded() {
    require(
      flightSuretyData.hasFunded(msg.sender),
      'Sender must have provided funding'
    );
    _;
  }

  constructor(address dataContractAddress) public {
    operational = true;
    contractOwner = msg.sender;
    flightSuretyData = FlightSuretyData(dataContractAddress);
  }

  function setOperatingStatus(bool mode)
    external
    requireContractOwner
    differentModeRequest(mode)
  {
    operational = mode;
  }

  function registerAirline(address airlineAddress)
    external
    requireIsOperational
    airlineRegistered
    airlineFunded
  {
    // only first Airline can register a new airline when less than 4 airlines are registered
    if (flightSuretyData.registeredAirlinesCount() < 4) {
      require(
        flightSuretyData.firstAirline() == msg.sender,
        'Less than 4 airlines registered: only first airline registered can register new ones'
      );
      flightSuretyData.registerAirline(airlineAddress, msg.sender);
    } else {
      // multi party consensus
      bool isDuplicate = false;
      for (uint256 i = 0; i < votes[airlineAddress].length; i++) {
        if (votes[airlineAddress][i] == msg.sender) {
          isDuplicate = true;
          break;
        }
      }
      require(!isDuplicate, 'Caller has already voted');
      votes[airlineAddress].push(msg.sender);

      if (votesLeft(airlineAddress) == 0) {
        votes[airlineAddress] = new address[](0);
        flightSuretyData.registerAirline(airlineAddress, msg.sender);
      }
    }
  }

  function fund()
    external
    payable
    airlineRegistered
    enoughFund
    requireIsOperational
  {
    flightSuretyData.fund.value(msg.value)(msg.sender);
  }

  function registerFlight(
    uint256 takeOff,
    uint256 landing,
    string flightRef,
    uint256 price,
    string from,
    string to
  ) external requireIsOperational airlineFunded {
    flightSuretyData.registerFlight(
      takeOff,
      landing,
      flightRef,
      price,
      from,
      to,
      msg.sender
    );
    emit FlightRegistered(flightRef, from, to, takeOff);
  }

  function book(bytes32 key, uint256 amount)
    external
    payable
    valWithinRange(amount, 0, 1.05 ether) // +0.05 to cover gas costs
    paidEnough(flightSuretyData.getFlightPrice(key).add(amount))
    checkValue(flightSuretyData.getFlightPrice(key).add(amount))
    requireIsOperational
  {
    flightSuretyData.book.value(msg.value)(
      key,
      amount.mul(3).div(2),
      msg.sender
    );
  }

  function withdraw() external requireIsOperational {
    flightSuretyData.pay(msg.sender);
    emit WithdrawRequest(msg.sender);
  }

  // Generate a request for oracles to fetch flight information
  function fetchFlightStatus(bytes32 key) external {
    uint8 index = getRandomIndex(msg.sender);
    oracleResponses[key] = ResponseInfo({
      requester: msg.sender,
      isOpen: true
    });
    emit OracleRequest(index, key);
  }

  // Register an oracle with the contract
  function registerOracle() external payable {
    // Require registration fee
    require(msg.value >= REGISTRATION_FEE, 'Registration fee is required');

    uint8[3] memory indexes = generateIndexes(msg.sender);

    oracles[msg.sender] = Oracle({ isRegistered: true, indexes: indexes });
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

  function votesLeft(address airlineToBeAdded)
    internal
    view
    returns (uint256 remainingVotes)
  {
    uint256 registeredVotes = votes[airlineToBeAdded].length;
    uint256 threshold = flightSuretyData.registeredAirlinesCount().div(2);
    remainingVotes = threshold.sub(registeredVotes);
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
    requireIsOperational
  {
    flightSuretyData.processFlightStatus(key, statusCode);
    emit FlightProcessed(key, statusCode);
  }
}
