// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-governance/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts-governance/token/ERC20/utils/SafeERC20.sol';

import '../interfaces/IStrategy.sol';

contract MockStrategy is IStrategy {
    using SafeERC20 for IERC20;

    uint256 public yieldAmount;
    address public immutable override token;
    mapping(address => uint256) public override balanceOf;

    constructor(address _token, uint256 _yieldAmount) {
        token = _token;
        yieldAmount = _yieldAmount;
    }

    function deposit(uint256 _amount) external override returns (bool) {
        balanceOf[msg.sender] += _amount;
        return true;
    }

    function redeem(address _backer, uint256 _backedAmount) external override returns (bool) {
        require(balanceOf[msg.sender] > 0, 'ZERO BALANCE');

        balanceOf[msg.sender] -= _backedAmount;

        IERC20(token).safeTransfer(_backer, _backedAmount);

        return true;
    }

    function withdraw(address _beneficiary, uint256 _backedAmount)
        external
        override
        returns (bool)
    {
        // fulfills interface constraint + stops hardhat warning during compilation of unused param
        _backedAmount;

        if (yieldAmount == 0) {
            return false;
        }

        IERC20(token).safeTransfer(_beneficiary, yieldAmount);

        yieldAmount = 0;

        return true;
    }

    function withdrawAll(address _recipient) external override {
        IERC20(token).safeTransfer(_recipient, balanceOf[msg.sender] + yieldAmount);

        balanceOf[msg.sender] = 0;
    }

    /// @notice withdrawable amount
    function withdrawableQueue() external view override returns (uint256) {
        return yieldAmount;
    }
}
