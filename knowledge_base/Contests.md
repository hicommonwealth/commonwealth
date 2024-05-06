# Contests

Contests is a new feature available for communities on Common. This document outlines the implementation of Contests on our platform.

## Basic Rules

Each community may have only one contest running. Contests continue to run even if the prize pool is empty, but no payments will be made to winners in such cases.

Admins cannot interfere with the content submission and voting processes. To be able to change constructor variables, admins must deploy a new contest contract with their new desired variables.

On-chain data submission will be conducted and sponsored by Commonwealth Labs. The Common platform will not get any fee or share from the contests.

Contests logic is managed by `Contest.sol`, and financial processes by the `FeeManager.sol` contract.

## Contest Funding and Economics

Contest prizes are primarily funded through the namespace’s Community Stake transaction commissions. This will be used by the `FeeManager.sol` contract, and CommunityStake fees generated from the community's staking activities will be directed to the contest contract. Additionally, direct transfers to the contest contract are also supported.

Contest project will be able to utilize both ETH and ERC20 tokens. As of 240506, there is no additional funding plan for the contest project.

### Contest Pool and Prizes

Common content that receives the most votes will be rewarded with the weekly contest prize.

Prizes will be distributed based on the following variables:

- Number of winners (`_numWinners`, uint256)
- Number of winners' shares (`winnerShares`, Array of values)
- Shares of each contest from the Namespace pool (int8)

For Version 1 (V1), admins will set the distribution and prize percentage. The interval is fixed at 7 days with a prize distribution of 80/15/5.

Version 2 (V2) will introduce the ability to change contest intervals and voting strategies.

### Voting Weight Strategies

Initially, custom vote-weight strategies for the community are not available. The default strategy is "1 stake = 1 vote", similar to the current upvote weight used on the platform with [Stake](./Stake.md) enabled. Communities that would like to integrate contests must have community staking.

NB: In the current off-chain topics, all community members start with 1 vote weight even if they do not have any community stake token. For on-chain contests, the amount of voting weight directly equals the amount of the community stake tokens the user owns.

## Oracle and On-chain Updates

Common will act as an oracle, updating contest information to on-chain.

The platform will self-manage gas sponsorship for on-chain transactions related to contests. This includes content submission and votes.

Content submission is deployed to blockchain to be able to open for voting.

We can integrate voting data deployment strategies for gas optimization.

## Change Log

240406: Authored by Ege Tekiner and Graham Johnson (#).
