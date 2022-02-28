// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IYearnVault {
    function decimals() external returns (uint256);

    function pricePerShare() external returns (uint256);

    function balanceOf(address _account) external returns (uint256);

    function deposit(uint256 _amount) external returns (uint256);

    function withdraw(uint256 _maxShares, address _recipient) external returns (uint256);

    function withdrawableQueue(address _account) external view returns (uint256);
}
