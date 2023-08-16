import { BigNumber, ethers, providers } from 'ethers';
import {
  GovernorCompatibilityBravo__factory,
  IGovernorCompatibilityBravo,
} from 'common-common/src/eth/types';
import { TypedEvent } from 'common-common/src/eth/types/commons';
import { ICompoundProposalResponse } from 'adapters/chain/compound/types';
import { ProposalState } from 'chain-events/src/chains/compound/types';

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type CompoundBravoProposalType = UnwrapPromise<
  ReturnType<IGovernorCompatibilityBravo['proposals']>
>;

type ProposalCreatedEventArgsArray = [
  BigNumber,
  string,
  string[],
  BigNumber[],
  string[],
  string[],
  BigNumber,
  BigNumber,
  string
];

type ProposalCreatedEventArgsObject = {
  proposalId: BigNumber;
  proposer: string;
  targets: string[];
  values: BigNumber[];
  signatures: string[];
  calldatas: string[];
  startBlock: BigNumber;
  endBlock: BigNumber;
  description: string;
};

type ProposalDataType = {
  rawProposal: CompoundBravoProposalType;
  proposalState: number;
  proposalCreatedEvent: TypedEvent<
    ProposalCreatedEventArgsArray & ProposalCreatedEventArgsObject
  >;
};

export function formatCompoundBravoProposal(
  proposalData: ProposalDataType
): ICompoundProposalResponse {
  return {
    identifier: proposalData.rawProposal.id.toString(),
    id: proposalData.rawProposal.id.toString(),
    proposer: proposalData.rawProposal.proposer,
    targets: proposalData.proposalCreatedEvent.args.targets,
    values: proposalData.proposalCreatedEvent.args[4].map((v) => v.toString()),
    signatures: proposalData.proposalCreatedEvent.args.signatures,
    calldatas: proposalData.proposalCreatedEvent.args.calldatas.map((c) =>
      ethers.utils.hexlify(c)
    ),
    startBlock: +proposalData.rawProposal.startBlock,
    endBlock: +proposalData.rawProposal.endBlock,
    description: proposalData.proposalCreatedEvent.args.description,
    eta: +proposalData.rawProposal.eta,
    queued: proposalData.proposalState === ProposalState.Queued,
    executed: proposalData.rawProposal.executed,
    cancelled: proposalData.rawProposal.canceled,
    expired: proposalData.proposalState === ProposalState.Expired,
    completed:
      proposalData.proposalState === ProposalState.Executed ||
      proposalData.proposalState === ProposalState.Canceled ||
      proposalData.proposalState === ProposalState.Expired ||
      proposalData.proposalState === ProposalState.Defeated,
  };
}

export async function getCompoundBravoProposals(
  compoundGovAddress: string,
  provider: providers.Web3Provider
): Promise<ProposalDataType[]> {
  const contract = GovernorCompatibilityBravo__factory.connect(
    compoundGovAddress,
    provider
  );
  await contract.deployed();

  // OpenZeppelin's Governor doesn't have initialProposalId or proposalCount method so need to fetch
  // all proposal created events and then fetch each proposal individually
  const proposalCreatedEvents = await contract.queryFilter<
    ProposalCreatedEventArgsArray,
    ProposalCreatedEventArgsObject
  >(
    contract.filters.ProposalCreated(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ),
    0,
    'latest'
  );

  // console.log("Proposal created event (tribe):", JSON.stringify(proposalCreatedEvents[0], null, 2));

  const proposalPromises: Promise<CompoundBravoProposalType>[] = [];
  const proposalStatePromises: Promise<number>[] = [];
  for (const propCreatedEvent of proposalCreatedEvents) {
    proposalPromises.push(contract.proposals(propCreatedEvent.args.proposalId));
    proposalStatePromises.push(
      contract.state(propCreatedEvent.args.proposalId)
    );
  }

  const [proposals, proposalStates] = await Promise.all([
    Promise.all(proposalPromises),
    Promise.all(proposalStatePromises),
  ]);

  const allProposalData: ProposalDataType[] = [];
  for (let i = 0; i < proposals.length; i++) {
    allProposalData.push({
      rawProposal: proposals[i],
      proposalState: proposalStates[i],
      proposalCreatedEvent: proposalCreatedEvents.find((p) =>
        p.args.proposalId.eq(proposals[i].id)
      ),
    });
  }

  return allProposalData;
}
