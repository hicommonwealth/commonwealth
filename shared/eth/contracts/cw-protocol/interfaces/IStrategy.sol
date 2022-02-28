// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStrategy {
    function token() external view returns (address);

    function balanceOf(address _account) external view returns (uint256);

    function deposit(uint256 _amount) external returns (bool);

    function redeem(address _backer, uint256 _backedAmount) external returns (bool);

    function withdraw(address _beneficiary, uint256 _totalBackedAmount) external returns (bool);

    function withdrawAll(address _recipient) external;

    function withdrawableQueue() external view returns (uint256);
}
