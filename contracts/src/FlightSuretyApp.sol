pragma solidity ^0.4.25;

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


  // Multi-party consensus - votes count for to-be-added airline
  mapping(address => address[]) internal votes;

  event FlightRegistered(
    string flightRef,
    string from,
    string to,
    uint256 takeOff
  );
  event WithdrawRequest(address recipient);

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


  function votesLeft(address airlineToBeAdded)
  internal
  view
  returns (uint256 remainingVotes)
  {
    uint256 registeredVotes = votes[airlineToBeAdded].length;
    uint256 threshold = flightSuretyData.registeredAirlinesCount().div(2);
    remainingVotes = threshold.sub(registeredVotes);
  }
}
