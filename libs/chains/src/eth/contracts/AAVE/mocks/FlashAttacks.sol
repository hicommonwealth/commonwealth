// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.5;
pragma abicoder v2;

import {IAaveGovernanceV2} from '../interfaces/IAaveGovernanceV2.sol';
import {IERC20} from './interfaces/IERC20.sol';
import {IExecutorWithTimelock} from '../interfaces/IExecutorWithTimelock.sol';


contract FlashAttacks {

  IERC20 internal immutable TOKEN;
  address internal immutable MINTER;
  IAaveGovernanceV2 internal immutable GOV;

  constructor(address _token, address _MINTER, address _governance) {
    TOKEN = IERC20(_token);
    MINTER = _MINTER;
    GOV = IAaveGovernanceV2(_governance);
  }

  function flashVote(uint256 votePower, uint256 proposalId, bool support) external {
    TOKEN.transferFrom(MINTER,address(this), votePower);
    GOV.submitVote(proposalId, support);
    TOKEN.transfer(MINTER, votePower);
  }

  function flashVotePermit(uint256 votePower, uint256 proposalId,
    bool support,
    uint8 v,
    bytes32 r,
    bytes32 s) external {
    TOKEN.transferFrom(MINTER, address(this), votePower);
    GOV.submitVoteBySignature(proposalId, support, v, r, s);
    TOKEN.transfer(MINTER, votePower);
  }

  function flashProposal(uint256 proposalPower, IExecutorWithTimelock executor,
    address[] memory targets,
    uint256[] memory values,
    string[] memory signatures,
    bytes[] memory calldatas,
    bool[] memory withDelegatecalls,
    bytes32 ipfsHash) external {
    TOKEN.transferFrom(MINTER, address(this),proposalPower);
    GOV.create(executor, targets, values, signatures, calldatas, withDelegatecalls, ipfsHash);
    TOKEN.transfer(MINTER, proposalPower);
  }
}
