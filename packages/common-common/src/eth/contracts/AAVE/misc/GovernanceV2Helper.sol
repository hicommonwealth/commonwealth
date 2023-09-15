// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.5;
pragma abicoder v2;

import {IAaveGovernanceV2} from '../interfaces/IAaveGovernanceV2.sol';
import {IProposalValidator} from '../interfaces/IProposalValidator.sol';
import {IExecutorWithTimelock} from '../interfaces/IExecutorWithTimelock.sol';
import {IGovernanceStrategy} from '../interfaces/IGovernanceStrategy.sol';
import {IGovernancePowerDelegationToken} from '../interfaces/IGovernancePowerDelegationToken.sol';
import {IGovernanceV2Helper} from './interfaces/IGovernanceV2Helper.sol';
import {SafeMath} from '../dependencies/open-zeppelin/SafeMath.sol';

/**
 * @title Governance V2 helper contract
 * @dev Allows to easily read data from AaveGovernanceV2 contract
 * - List of proposals with state
 * - List of votes per proposal and voters
 * @author Aave
 **/
contract GovernanceV2Helper is IGovernanceV2Helper {
    using SafeMath for uint256;
    uint256 public constant ONE_HUNDRED_WITH_PRECISION = 10000;

    function getProposal(uint256 id, IAaveGovernanceV2 governance)
    public
    view
    override
    returns (ProposalStats memory proposalStats)
    {
        IAaveGovernanceV2.ProposalWithoutVotes memory proposal = governance.getProposalById(id);
        uint256 votingSupply =
                                IGovernanceStrategy(proposal.strategy).getTotalVotingSupplyAt(proposal.startBlock);
        return
            ProposalStats({
            totalVotingSupply: votingSupply,
            minimumQuorum: IProposalValidator(address(proposal.executor)).MINIMUM_QUORUM(),
            minimumDiff: IProposalValidator(address(proposal.executor)).VOTE_DIFFERENTIAL(),
            executionTimeWithGracePeriod: proposal.executionTime > 0
            ? IExecutorWithTimelock(proposal.executor).GRACE_PERIOD().add(proposal.executionTime)
            : proposal.executionTime,
            proposalCreated: proposal.startBlock.sub(governance.getVotingDelay()),
            id: proposal.id,
            creator: proposal.creator,
            executor: proposal.executor,
            targets: proposal.targets,
            values: proposal.values,
            signatures: proposal.signatures,
            calldatas: proposal.calldatas,
            withDelegatecalls: proposal.withDelegatecalls,
            startBlock: proposal.startBlock,
            endBlock: proposal.endBlock,
            executionTime: proposal.executionTime,
            forVotes: proposal.forVotes,
            againstVotes: proposal.againstVotes,
            executed: proposal.executed,
            canceled: proposal.canceled,
            strategy: proposal.strategy,
            ipfsHash: proposal.ipfsHash,
            proposalState: governance.getProposalState(id)
        });
    }

    function getProposals(
        uint256 skip,
        uint256 limit,
        IAaveGovernanceV2 governance
    ) external view override returns (ProposalStats[] memory proposalsStats) {
        uint256 count = governance.getProposalsCount().sub(skip);
        uint256 maxLimit = limit > count ? count : limit;

        proposalsStats = new ProposalStats[](maxLimit);

        for (uint256 i = 0; i < maxLimit; i++) {
            proposalsStats[i] = getProposal(i.add(skip), governance);
        }

        return proposalsStats;
    }

    function getTokensPower(address user, address[] memory tokens)
    external
    view
    override
    returns (Power[] memory power)
    {
        power = new Power[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            IGovernancePowerDelegationToken delegation = IGovernancePowerDelegationToken(tokens[i]);
            uint256 currentVotingPower = delegation.getPowerCurrent(user, IGovernancePowerDelegationToken.DelegationType.VOTING_POWER);
            uint256 currentPropositionPower = delegation.getPowerCurrent(user, IGovernancePowerDelegationToken.DelegationType.PROPOSITION_POWER);
            address delegatedAddressVotingPower = delegation.getDelegateeByType(user, IGovernancePowerDelegationToken.DelegationType.VOTING_POWER);
            address delegatedAddressPropositionPower = delegation.getDelegateeByType(user, IGovernancePowerDelegationToken.DelegationType.PROPOSITION_POWER);

            power[i] = Power(
                currentVotingPower,
                delegatedAddressVotingPower,
                currentPropositionPower,
                delegatedAddressPropositionPower
            );

        }

        return power;
    }

}
