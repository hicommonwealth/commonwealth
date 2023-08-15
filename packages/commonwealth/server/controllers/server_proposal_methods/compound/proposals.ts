import { BigNumber, ethers, providers } from 'ethers';
import {
  GovernorCompatibilityBravo__factory,
  IGovernorCompatibilityBravo,
} from 'common-common/src/eth/types';
import { TypedEvent } from 'common-common/src/eth/types/commons';
import { ICompoundProposalResponse } from 'adapters/chain/compound/types';

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
    values: proposalData.proposalCreatedEvent.args.values.map((v) =>
      v.toString()
    ),
    signatures: proposalData.proposalCreatedEvent.args.signatures,
    calldatas: proposalData.proposalCreatedEvent.args.calldatas.map((c) =>
      ethers.utils.hexlify(c)
    ),
    startBlock: +proposalData.rawProposal.startBlock,
    endBlock: +proposalData.rawProposal.endBlock,
    description: proposalData.proposalCreatedEvent.args.description,
    completed: true,
    eta: +proposalData.rawProposal.eta,
    queued: true,
    executed: proposalData.rawProposal.executed,
    cancelled: proposalData.rawProposal.canceled,
    expired: true,
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

  const initialProposalId = await contract.initialProposalId();
  const proposalCount = await contract.proposalCount();

  const proposalPromises: Promise<CompoundBravoProposalType>[] = [];
  const proposalStatePromises: Promise<number>[] = [];
  for (let i = initialProposalId; i <= proposalCount; i++) {
    const proposal = contract.proposals(i);
    proposalPromises.push(proposal);
    proposalStatePromises.push(contract.state(i));
  }

  const proposalCreatedEventPromise = contract.queryFilter<
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

  const [proposals, proposalStates, proposalCreatedEvents] = await Promise.all([
    Promise.all(proposalPromises),
    Promise.all(proposalStatePromises),
    proposalCreatedEventPromise,
  ]);

  const allProposalData: ProposalDataType[] = [];
  for (let i = 0; i < proposals.length; i++) {
    allProposalData.push({
      rawProposal: proposals[i],
      proposalState: proposalStates[i],
      proposalCreatedEvent: proposalCreatedEvents.find((p) =>
        p.args.proposalId.eq(i)
      ),
    });
  }

  return allProposalData;
}
