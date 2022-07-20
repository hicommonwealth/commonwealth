// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.5;
pragma abicoder v2;

interface IERC20 {
  function totalSupplyAt(uint256 blockNumber) external view returns (uint256);

  function balanceOf(address account) external view returns (uint256);
}
