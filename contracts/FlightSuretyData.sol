pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";


contract FlightSuretyData {
    using SafeMath for uint8;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;         // Account used to deploy contract
    bool public operational = true;       // Blocks all state changes throughout the contract if false
    mapping(address => bool) public authorizedCallers;

    struct Airline {
        bool registered;
        bool funded;
    }

    mapping(address => Airline) public airlines;

    uint8 public registeredAirlinesCount;
    address public firstAirline;

    address[] public multiCalls = new address[](0);
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */

    constructor(address _firstAirline) public {
        contractOwner = msg.sender;

        // register first airline at deployment
        firstAirline = _firstAirline;
        registeredAirlinesCount = 1;
        airlines[firstAirline].registered = true;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/
    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.
    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
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

    modifier airlineFunded() {
        require(
            airlines[msg.sender].funded == true,
            "Airline must spend the funding fee before being able to perform this action");
        _;
    }
    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/
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

    function threshold() internal view returns (uint threshold) {
        threshold = registeredAirlinesCount.div(2);
    }
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

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
    airlineRegistered(originAddress)
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
        }
    }


   /**
    * @dev Passenger Buys insurance for a flight
    *
    */
    function buy()
    external
    requireIsOperational
    payable
    {

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
    function fund()
    public
    requireIsOperational
    // airlineRegistered
    payable
    {
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
    function() external payable
    {
        fund();
    }


}
