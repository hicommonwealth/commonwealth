// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {DataTypes} from '../../DataTypes.sol';
import "../ProjectBase.sol";
import "../../external/util/Initializable.sol";
import '@openzeppelin/contracts-governance/proxy/Clones.sol';
import "../Interfaces/IBasicProject.sol";

contract BasicProject is ProjectBase, Initializable {
    using SafeERC20 for IERC20;
    using DataTypes for DataTypes.ProjectMetaData;

    // keeps track of backer deposit amounts
    mapping(address => uint256) public backers;

    /// @notice Initialize
    /// @param _metaData Contract metadata
    /// @param _threshold Minimum value for a project to be successful
    /// @param _deadline Timestamp at which project must meet threshold
    /// @param _protocolFee The protocol fee percentage at time of project creation
    /// @param _protocolFeeTo The address to send the protocol fee to
    /// @param _acceptedToken Token accepted for funding
    /// @param _beneficiary The address to send the funds to if the project is funded
    function initialize(
        DataTypes.ProjectMetaData memory _metaData,
        uint256 _threshold,
        uint256 _deadline,
        uint256 _protocolFee,
        address _protocolFeeTo,
        address _acceptedToken,
        address _beneficiary
    ) external initializer returns (bool) {
        metaData = _metaData;
        threshold = _threshold;
        deadline = block.timestamp + _deadline; // save deadline as timestamp in future
        protocolFee = _protocolFee;
        protocolFeeTo = _protocolFeeTo;
        acceptedToken = _acceptedToken;
        beneficiary = _beneficiary;
        return true;
    }

    /// @notice backers deposit ERC20 tokens
    /// @param _amount backing amount
    function back(uint256 _amount) external override onlyActiveValidBalance(_amount) returns (bool) {
        IERC20(acceptedToken).safeTransferFrom(msg.sender, address(this), _amount);
        // increment funding amount for total
        totalFunding += _amount;
        // increment funding amount from backer
        backers[msg.sender] += _amount;

        emit Back(msg.sender, acceptedToken, _amount);

        if (totalFunding >= threshold && !funded) {
            funded = true;
            emit Succeeded(block.timestamp, totalFunding);
        }
        return true;
    }

    /// @notice Allows the beneficiary to withdraw all the deposited funds minus the protocol fee which is also paid out
    function beneficiaryWithdraw() external override noRewithdraw onlyFinishedFundedProject returns (bool) {
        // TODO: do we need checks to ensure protocol fee can be paid is that not in the domain of possible states
        // pay the protocol fee which is a percentage of the threshold amount
        uint256 protocolFeeAmount = (protocolFee / 10000) * threshold;
        safeTransferToken(acceptedToken, protocolFeeTo, protocolFeeAmount);
        emit Withdraw(protocolFeeTo, protocolFeeAmount);

        // all remaining funds go to beneficiary
        uint256 withdrawAmount = totalFunding - protocolFeeAmount;
        safeTransferToken(acceptedToken, beneficiary, withdrawAmount);
        emit Withdraw(beneficiary, withdrawAmount);

        return true;
    }

    /// @notice Allows backers to withdraw all of their funds if the project has failed
    function backersWithdraw() external override onlyFinishedFailedProject returns (bool) {
        uint256 balance = backers[msg.sender];
        require(balance > 0, 'PJ: BALANCE_ZERO');

        backers[msg.sender] = 0;
        safeTransferToken(acceptedToken, msg.sender, balance);

        emit Withdraw(msg.sender, balance);
        return true;
    }
}
