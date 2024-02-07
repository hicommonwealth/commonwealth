// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.5;
pragma abicoder v2;

interface IGovernancePowerDelegationToken {
  enum DelegationType {VOTING_POWER, PROPOSITION_POWER}

  /**
   * @dev returns the delegatee of an user
   * @param delegator the address of the delegator
   **/
  function getDelegateeByType(
    address delegator,
    DelegationType delegationType
  ) external view virtual returns (address);

  /**
   * @dev returns the current delegated power of a user. The current power is the
   * power delegated at the time of the last snapshot
   * @param user the user
   **/
  function getPowerCurrent(
    address user,
    DelegationType delegationType
  ) external view virtual returns (uint256);

  /**
   * @dev get the power of a user at a specified block
   * @param user address of the user
   * @param blockNumber block number at which to get power
   * @param delegationType delegation type (propose/vote)
   **/
  function getPowerAtBlock(
    address user,
    uint256 blockNumber,
    DelegationType delegationType
  ) external view returns (uint256);
}
