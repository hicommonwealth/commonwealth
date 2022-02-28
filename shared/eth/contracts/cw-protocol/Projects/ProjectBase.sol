// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-governance/token/ERC20/utils/SafeERC20.sol';
//import {DataTypes} from '../DataTypes.sol';
import "../DataTypes.sol";
import "./Interfaces/IProjectBase.sol";


abstract contract ProjectBase {
    using SafeERC20 for IERC20;
    using DataTypes for DataTypes.ProjectMetaData;

    event Back(address sender, address token, uint256 amount);
    event Withdraw(address sender, uint256 amount);
    event Succeeded(uint256 timestamp, uint256 amount);
    event Failed();

    DataTypes.ProjectMetaData public metaData;

    /// @notice Minimum value for a project to be successful
    uint256 public threshold;

    /// @notice Deadline by which project must meet funding threshold
    uint256 public deadline;

    /// @notice Total project funding to-date
    uint256 public totalFunding;

    /// @notice The protocol fee percentage at time of project creation
    uint256 public protocolFee;

    // @notice The address to send the protocol fee to
    address public protocolFeeTo;

    // @notice The only token this project accepts for funding
    address public acceptedToken;

    // @notice Address to which all funds will be withdrawn to if the project is funded
    address public beneficiary;

    /// @notice Prevents re-withdrawal of funds
    bool public lockedWithdraw;

    /// @notice Signals whether project has met funding threshold
    bool public funded;

    modifier onlyFinishedFundedProject() {
        require(block.timestamp >= deadline, 'Project has not yet closed.');
        require(funded, 'Project not funded.');
        _;
    }

    modifier onlyFinishedFailedProject() {
        require(block.timestamp >= deadline, 'PJ: NOT_FINISHED');
        require(!funded, 'PJ: FUNDED_PROJECT');
        _;
    }

    modifier onlyActiveValidBalance(uint256 _amount) {
        require(block.timestamp < deadline, 'PJ: DEADLINE_PASSED');
        require(_amount > 0, 'PJ: INVALID_BACKING_AMOUNT');
        _;
    }

    modifier noRewithdraw() {
        require(!lockedWithdraw, 'PJ: RE_WITHDRAW');
        lockedWithdraw = true;
        _;
    }

    modifier onlyCreator() {
        require(msg.sender == metaData.creator);
        _;
    }

    /// @notice set project Name
    function setName(bytes32 _name) external onlyCreator {
        metaData.name = _name;
    }

    /// @notice set project ipfsHash
    function setIpfsHash(bytes32 _ipfsHash) external onlyCreator {
        metaData.ipfsHash = _ipfsHash;
    }

    /// @notice set project CW url
    // TODO: remove cw url from the metadata and instead have getter function that constructs the url from the hash/id's
    // function setCwUrl(bytes32 _cwUrl) external onlyCreator {
    //     metaData.cwUrl = _cwUrl;
    // }

    // Functions without implementations cannot have modifiers
    function back(uint256 _value) external virtual returns (bool);

    function beneficiaryWithdraw() external virtual returns (bool);

    function backersWithdraw() external virtual returns (bool);


    /// @dev transfer token by checking the balance
    /// @param _token Token being transferred
    /// @param _to Recipient address
    /// @param _amount Transfer amount
    function safeTransferToken(
        address _token,
        address _to,
        uint256 _amount
    ) internal returns (bool) {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        uint256 amount = _amount;

        if (balance < amount) {
            amount = balance;
        }

        IERC20(_token).safeTransfer(_to, amount);
        return true;
    }
}
