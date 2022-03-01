// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-governance/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts-governance/proxy/Clones.sol';
import '../../external/util/Initializable.sol';
import '../../CWToken.sol';
import '../ProjectBase.sol';
import {DataTypes} from '../../DataTypes.sol';

contract CuratedProject is ProjectBase, Initializable {
    using SafeERC20 for IERC20;
    using DataTypes for DataTypes.ProjectMetaData;

    event Curate(address sender, address token, uint256 amount);

    /// @notice Project bToken allocated to backers
    address public bToken;
    /// @notice Project cToken allocated to curators
    address public cToken;

    // TODO: since this value is only set if project is funded, the value is 0 if
    // TODO: the project passes the deadline (thus backers won't be able to pull out rewards)
    uint256 public totalCuratorFunding;

    /// @notice Project fee awarded to curators on project success
    uint256 public curatorFee;

    function initialize(
        DataTypes.ProjectMetaData memory _metaData,
        DataTypes.ProjectData memory _pData,
        uint256 _curatorFee,
        uint256 _protocolFee,
        address _protocolFeeTo,
        address _bToken,
        address _cToken
    ) public initializer returns (bool) {
        metaData = _metaData;
        threshold = _pData.threshold;
        deadline = block.timestamp + _pData.deadline; // save deadline as timestamp in future
        curatorFee = _curatorFee;

        protocolFee = _protocolFee;
        protocolFeeTo = _protocolFeeTo;
        acceptedToken = _pData.acceptedToken;
        beneficiary = _pData.beneficiary;

        bToken = _bToken;
        cToken = _cToken;

        return true;
    }

    /// @notice backers deposit ERC20 tokens
    /// @param _amount Token value allocated to backing project
    function back(uint256 _amount)
    external
    override
    onlyActiveValidBalance(_amount)
    returns (bool)
    {
        // deposit _amount to balance address
        IERC20(acceptedToken).safeTransferFrom(msg.sender, address(this), _amount);
        // Mints bToken equivalence to  msg.sender
        CWToken(bToken).mint(msg.sender, _amount);
        // increment funding amount for total
        totalFunding += _amount;

        emit Back(msg.sender, acceptedToken, _amount);

        if (totalFunding >= threshold) {
            funded = true;
            totalCuratorFunding = IERC20(cToken).totalSupply();
            emit Succeeded(block.timestamp, totalFunding);
        }

        return true;
    }

    /// @notice Backers deposit ERC20 tokens and receive cTokens
    /// @param _amount Token value allocated to project curation
    function curate(uint256 _amount)
    external
    onlyActiveValidBalance(_amount)
    returns (bool)
    {
        require(!funded, 'PJ: FUNDED_PROJECT');

        // deposit acceptedToken to the Project
        IERC20(acceptedToken).safeTransferFrom(msg.sender, address(this), _amount);
        // mints the same amount of acceptedToken to the msg.sender
        CWToken(cToken).mint(msg.sender, _amount);

        emit Curate(msg.sender, acceptedToken, _amount);
        return true;
    }

    /// @dev withdraw all funds to the beneficiary
    function beneficiaryWithdraw() external override noRewithdraw onlyFinishedFundedProject returns (bool) {
        // TODO: if amount < 100 gwei then curatorReservedAmount = 0 which means they can't withdraw
        uint256 curatorReservedAmount = (threshold * curatorFee) / 100;
        uint256 protocolFeeAmount = (threshold * protocolFee) / 100;
        uint256 beneficiaryWithdrawAmount = totalFunding - curatorReservedAmount - protocolFeeAmount;

        // TODO: calling external contract vs storing address on initialization --- which is cheaper
        // address payable protocolFeeTo = IExpertFactory(metaData.factory).getProtocolData().feeTo;

        if (protocolFeeAmount > 0) {
            safeTransferToken(acceptedToken, protocolFeeTo, protocolFeeAmount);
            emit Withdraw(protocolFeeTo, protocolFeeAmount);
        }

        if (beneficiaryWithdrawAmount > 0) {
            safeTransferToken(acceptedToken, beneficiary, beneficiaryWithdrawAmount);
            emit Withdraw(beneficiary, beneficiaryWithdrawAmount);
        }

        return true;
    }

    // !funded, balance > 0, block.timestamp >= deadline
    /// @notice Backers redeem their BTokens if project fails to meet threshold by deadline
    /// @dev bTokens are burned. Backer receive donated funds with curator bonus.
    function backersWithdraw() external override onlyFinishedFailedProject returns (bool) {
        uint256 balance = IERC20(bToken).balanceOf(msg.sender);
        require(balance > 0, 'PJ: ZERO_B_TOKEN_BALANCE');

        // the percent of the total funding that the msg.sender holds
        // this is also the percent of the total curator funding that
        // the msg.sender is entitled to. Note that in this case it is
        // ok to use the totalFunding because the project will have
        // finished/failed so totalFunding will no longer change
        // amount of curator funding the msg.sender is entitled to
        uint256 bonusAmount = totalCuratorFunding * (balance / totalFunding);
        // the total amount the msg.sender can withdraw
        uint256 withdrawTotal = bonusAmount + balance;

        CWToken(bToken).burnFrom(msg.sender, balance);
        safeTransferToken(acceptedToken, msg.sender, withdrawTotal);

        emit Withdraw(msg.sender, withdrawTotal);
        return true;
    }

    // block.timestamp >= deadline, funded, balance > 0
    /// @notice Curators may redeem their cTokens upon project success, and receive a curatorFee as bonus.
    function curatorsWithdraw() external onlyFinishedFundedProject returns (bool) {
        uint256 balance = IERC20(cToken).balanceOf(msg.sender);
        require(balance > 0, 'PJ: NO_CURATED_BALANCE');

        // the percent of the total curator funds that the msg.sender holds
        uint256 percentOfCuratorFunds = balance / totalCuratorFunding;
        // the total fee amount in the acceptedToken
        uint256 curatorFeeTotal = (curatorFee / 10000) * threshold;
        // the amount the msg.sender gets from the curator fee
        uint256 bonusAmount = percentOfCuratorFunds * curatorFeeTotal;
        // the total amount the msg.sender can withdraw
        uint256 withdrawTotal = bonusAmount + balance;

        CWToken(cToken).burnFrom(msg.sender, balance);
        safeTransferToken(acceptedToken, msg.sender, withdrawTotal);

        emit Withdraw(msg.sender, withdrawTotal);
        return true;
    }
}
