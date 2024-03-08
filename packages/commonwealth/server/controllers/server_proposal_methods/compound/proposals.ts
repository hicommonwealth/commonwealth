import {
  GovernorAlpha,
  GovernorBravoDelegate,
  GovernorCompatibilityBravo,
  GovernorCountingSimple,
  TypedEvent,
} from '@hicommonwealth/chains';
import { ethers, providers, utils } from 'ethers';
import { ICompoundProposalResponse } from '../../../../shared/adapters/chain/compound/types';
import { ProposalState } from '../../../../shared/chain/types/compound';
import { getCompoundGovContractAndVersion } from './compoundVersion';
import {
  CompoundProposalType,
  GovVersion,
  ProposalCreatedEventArgsArray,
  ProposalCreatedEventArgsObject,
  ProposalDataType,
  ResolvedProposalPromises,
} from './types';

export function formatCompoundBravoProposal(
  proposalData: ProposalDataType,
): ICompoundProposalResponse {
  return {
    identifier:
      proposalData.identifier || proposalData.rawProposal.id.toString(),
    id: proposalData.rawProposal.id.toHexString(),
    proposer: proposalData.rawProposal.proposer,
    targets: proposalData.proposalCreatedEvent.targets,
    values: proposalData.proposalCreatedEvent.values.map((v) => v.toString()),
    signatures: proposalData.proposalCreatedEvent.signatures,
    calldatas: proposalData.proposalCreatedEvent.calldatas.map((c) =>
      ethers.utils.hexlify(c),
    ),
    startBlock: +proposalData.rawProposal.startBlock,
    endBlock: +proposalData.rawProposal.endBlock,
    description: proposalData.proposalCreatedEvent.description,
    eta: +proposalData.rawProposal.eta,
    state: proposalData.proposalState,
    completed:
      proposalData.proposalState === ProposalState.Executed ||
      proposalData.proposalState === ProposalState.Canceled ||
      proposalData.proposalState === ProposalState.Expired ||
      proposalData.proposalState === ProposalState.Defeated,
    forVotes: proposalData.rawProposal.forVotes,
    againstVotes: proposalData.rawProposal.againstVotes,
    abstainVotes: proposalData.rawProposal.abstainVotes,
  };
}

export async function getCompoundProposals(
  compoundGovAddress: string,
  provider: providers.Web3Provider,
): Promise<ProposalDataType[]> {
  const { contract, version: govVersion } =
    await getCompoundGovContractAndVersion(compoundGovAddress, provider);

  await contract.deployed();
  let proposalArrays: ResolvedProposalPromises;
  let initialProposalId: number;
  switch (govVersion) {
    case GovVersion.Alpha:
      initialProposalId = 1;
      proposalArrays = await getProposalAsync(
        <GovernorAlpha>contract,
        initialProposalId,
      );
      break;
    case GovVersion.Bravo:
      initialProposalId = +(await contract.initialProposalId());
      proposalArrays = await getProposalAsync(
        <GovernorBravoDelegate>contract,
        initialProposalId,
      );
      break;
    case GovVersion.OzBravo:
      proposalArrays = await getProposalDataSequentially(
        <GovernorCompatibilityBravo>contract,
      );
      break;
    case GovVersion.OzCountSimple:
      proposalArrays = await getProposalDataFieldsSequentially(
        <GovernorCountingSimple>contract,
      );
      break;
    default:
      throw new Error(`Invalid Compound contract version: ${govVersion}`);
  }

  const [proposalCreatedEvents, proposals, proposalStates] = proposalArrays;

  const allProposalData: ProposalDataType[] = [];
  for (let i = 0; i < proposals.length; i++) {
    allProposalData.push({
      rawProposal: proposals[i],
      proposalState: proposalStates[i],
      proposalCreatedEvent: proposalCreatedEvents.find((p) =>
        p.id.eq(proposals[i].id),
      ),
    });
  }

  if (govVersion === GovVersion.OzBravo) {
    allProposalData
      .sort((p) => +p.rawProposal.startBlock)
      .forEach((p, i) => (p.identifier = String(i)));
  }

  return allProposalData;
}

/**
 * This is the fastest way to fetch proposal data for compound contracts because we can fetch proposal created events
 * and proposal data simultaneously. This is only possible for alpha and bravo contracts (and a mix of both) since they
 * have sequential proposal ids.
 * @param contract
 * @param initialProposalId
 */
async function getProposalAsync(
  contract: GovernorAlpha | GovernorBravoDelegate,
  initialProposalId: number,
): Promise<ResolvedProposalPromises> {
  console.log('Fetching proposal data asynchronously');
  const proposalCreatedEventsPromise = getProposalCreatedEvents(contract);
  const proposalDataPromises: Promise<CompoundProposalType>[] = [];
  const proposalStatePromises: Promise<number>[] = [];

  const proposalCount = +(await contract.proposalCount());

  for (let i = initialProposalId; i < proposalCount; i++) {
    proposalDataPromises.push(contract.proposals(i));
    proposalStatePromises.push(contract.state(i));
  }

  return Promise.all([
    proposalCreatedEventsPromise,
    Promise.all(proposalDataPromises),
    Promise.all(proposalStatePromises),
  ]);
}

/**
 * This is the slowest method of fetching all proposal data because it needs to fetch proposal created events before
 * iterating through them to fetch proposal data. This is the only way to fetch proposal data for oz and oz-compatible
 * bravo contracts since they don't have sequential proposal ids. We avoid this way of fetching at all costs.
 * @param contract
 */
async function getProposalDataSequentially(
  contract: GovernorCompatibilityBravo | GovernorBravoDelegate,
): Promise<ResolvedProposalPromises> {
  console.log('Fetching proposal data sequentially');
  const proposalCreatedEvents = await getProposalCreatedEvents(contract);

  const proposalDataPromises: Promise<CompoundProposalType>[] = [];
  const proposalStatePromises: Promise<number>[] = [];
  for (const propCreatedEvent of proposalCreatedEvents) {
    proposalDataPromises.push(contract.proposals(propCreatedEvent.id));
    proposalStatePromises.push(contract.state(propCreatedEvent.id));
  }

  const [proposals, proposalStates] = await Promise.all([
    Promise.all(proposalDataPromises),
    Promise.all(proposalStatePromises),
  ]);

  return [proposalCreatedEvents, proposals, proposalStates];
}

async function getProposalDataFieldsSequentially(
  contract: GovernorCountingSimple,
): Promise<ResolvedProposalPromises> {
  console.log('Fetching proposal data fields sequentially');
  const proposalCreatedEvents = await getProposalCreatedEvents(contract);

  const proposalDataPromises: Promise<CompoundProposalType>[] = [];
  const proposalStatePromises: Promise<number>[] = [];
  for (const propCreatedEvent of proposalCreatedEvents) {
    // Construct big promise
    const proposalDataFieldPromises: Promise<any>[] = [
      contract.proposalEta(propCreatedEvent.id),
      contract.proposalVotes(propCreatedEvent.id),
      contract.state(propCreatedEvent.id),
    ];

    const proposalDataPromise = Promise.all(proposalDataFieldPromises).then(
      (values) => {
        return {
          id: propCreatedEvent.id,
          proposer: propCreatedEvent.proposer,
          eta: values[0],
          startBlock: propCreatedEvent.startBlock,
          endBlock: propCreatedEvent.endBlock,
          forVotes: values[1].forVotes,
          againstVotes: values[1].againstVotes,
          abstainVotes: values[1]?.abstainVotes,
          canceled: values[2] == 7,
          executed: values[2] == 2,
        };
      },
    );

    proposalDataPromises.push(proposalDataPromise);
    proposalStatePromises.push(contract.state(propCreatedEvent.id));
  }

  const [proposals, proposalStates] = await Promise.all([
    Promise.all(proposalDataPromises),
    Promise.all(proposalStatePromises),
  ]);

  return [proposalCreatedEvents, proposals, proposalStates];
}

/**
 * This function is used to map a Compound compatible event arg array to a fully functional event arg object.
 * Uses:
 * 1. Convert proposalId to id in OZ and OZ Bravo Compatibility event args
 * 2. Properly set calldatas in OZ Bravo Compatibility event args
 * @param event A Compound compatible proposal created event
 */
export function mapProposalCreatedEvent(
  event: TypedEvent<ProposalCreatedEventArgsArray & any>,
): ProposalCreatedEventArgsObject {
  const result = utils.defaultAbiCoder.decode(
    [
      'uint',
      'address',
      'address[]',
      'uint[]',
      'string[]',
      'bytes[]',
      'uint',
      'uint',
      'bytes',
    ],
    event.data,
  );
  const [
    id,
    proposer,
    targets,
    values,
    signatures,
    calldatas,
    startBlock,
    endBlock,
    descriptionBytes,
  ] = result;
  const description = utils.toUtf8String(
    descriptionBytes,
    utils.Utf8ErrorFuncs.ignore,
  );

  return {
    id,
    proposer,
    targets,
    values,
    signatures,
    calldatas,
    startBlock,
    endBlock,
    description,
  };
}

async function getProposalCreatedEvents(
  contract:
    | GovernorAlpha
    | GovernorBravoDelegate
    | GovernorCompatibilityBravo
    | GovernorCountingSimple,
  fromBlock = 0,
  toBlock: number | 'latest' = 'latest',
): Promise<ProposalCreatedEventArgsObject[]> {
  const events = await contract.queryFilter<ProposalCreatedEventArgsArray, any>(
    contract.filters.ProposalCreated(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ),
    fromBlock,
    toBlock,
  );

  return events.map((e) => mapProposalCreatedEvent(e));
}
