# Contests

Contests is a new feature available for communities on Common. This document outlines the implementation of Contests on our platform.

## Basic Rules

Each community may have only one contest running. Contests continue to run even if the prize pool is empty, but no payments will be made to winners in such cases.

Admins cannot interfere with the content submission and voting processes. To be able to change constructor variables, admins must deploy a new contest contract with their new desired variables.

On-chain data submission will be conducted and sponsored by Commonwealth Labs. The Common platform will not get any fee or share from the contests.

Contests logic is managed by `Contest.sol`, and financial processes by the `FeeManager.sol` contract.

## Contest funding and economics

Contest prizes are primarily funded through the namespace’s Community Stake transaction commissions. This will be utilized by FeeManager.sol contract and CommunityStake fees generated from the community's staking activities, will be directed to the contest contract. Additionally, direct transfers to the contest contract are also supported.
Contest project will be able to utilize both ETH and ERC20 tokens.
As of righ now, there is no additional funding plan for the contest project.

Contest Pool and Prizes:

Content that will get most of the votes will be rewarded with the weekly contest prize.
Prizes will be distributed by the following variables:
Amount of winners (_numWinners) (uint256)
Their shares (winnerShares) -> Array of values
Shares of each contest from the Namespace pool -> int8
For Version 1 (V1), admins will set the distribution and prize percentage. The interval is fixed at 7 days with a prize distribution of 80/15/5.
Version 2 (V2) will introduce the ability to change contest intervals and voting strategies.

Voting weight strategies:

Initially, custom Vote Weight Strategies for the community will not be available. The default strategy will be "1 stake = 1 vote", similar to the current upvote weight used on the platform with Stake-enabled.

Thus, the communities that would like to integrate contests must have community stakes.
Note: In the current off-chain topics, all community members start with 1 vote weight even if they do not have any community stake token. For on-chain contests, the amount of voting weight will directly equal to the amount of the community stake tokens the user owns.

We are going to design and deploy more voting strategies as commonwealth protocol team as a trusted and tested resource.
We can make each 100 tokens = 1 vote

Oracle and On-chain Updates:

Common will act as an oracle, updating contest information to on-chain.
The platform will self-manage gas sponsorship for on-chain transactions related to contests. This includes content submission and votes.
Content submission is going to be deployed to blockchain to be able to open for voting.
We can integrate voting data deployment strategies for gas optimization.

Dev Notes:

The platform will allow on-chain contest creation without community stake but will restrict this functionality through the Commonwealth platform. Thus, we will need to keep the code modular and 3rd paty expandable.

The platform will not stop ongoing contests prematurely. Any updates, such as calling the newContest() function, will apply to the next contest cycle.

Possible Short term Tickets:

On-chain data deployment ticket: (P0)
Timestamp check: (basic fix - bug prevention)

Protocol team will need to implement a checking mechanism and test for the given time. To be able to prevent this, include the following lines in the proper areas:
require(_startTime >= block.timestamp, "Start time must be in the future");
require(block.timestamp > endTime, "Previous contest has not concluded");

WinnerShares and _numWinners check: (basic fix - bug prevention)

 Protocol team: needs to implement the same logic in the contract and check the numbers during the creation of the contract inside the constructor:
        require(_winnerShares.lenght ==_numWinners, “All winners must have a share”);
        For (uint i = 0; i < _numWinners; i++) {
            totalShare += winnerShares[I]; }
        require(totalShare == 100, “Sum of the winner shares must equal to 100”);

## Change Log

240305: Authored by Ege Tekiner and Graham Johnson (#).
