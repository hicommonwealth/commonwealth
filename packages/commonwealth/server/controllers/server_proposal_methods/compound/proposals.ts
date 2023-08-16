import { BigNumber, ethers, providers } from 'ethers';
import {
  Governor__factory,
  GovernorAlpha__factory,
  GovernorBravoDelegate__factory,
  GovernorCompatibilityBravo__factory,
  GovernorAlpha,
  GovernorBravoDelegate,
  Governor,
  GovernorCompatibilityBravo,
} from 'common-common/src/eth/types';
import { TypedEvent } from 'common-common/src/eth/types/commons';
import { ICompoundProposalResponse } from 'adapters/chain/compound/types';
import { ProposalState } from 'chain-events/src/chains/compound/types';
import { DB } from '../../../models';
import { cloneDeep } from 'lodash';

export enum GovVersion {
  Alpha = 'alpha',
  Bravo = 'bravo',
  Oz = 'oz',
  OzBravo = 'oz-bravo',
}

type CompoundProposalType = {
  id: BigNumber;
  proposer: string;
  eta: BigNumber;
  startBlock: BigNumber;
  endBlock: BigNumber;
  forVotes: BigNumber;
  againstVotes: BigNumber;
  abstainVotes?: BigNumber;
  canceled: boolean;
  executed: boolean;
};

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
  id: BigNumber;
  proposer: string;
  targets: string[];
  values: BigNumber[];
  signatures: string[];
  calldatas: string[];
  startBlock: BigNumber;
  endBlock: BigNumber;
  description: string;
};

type ResolvedProposalPromises = [
  TypedEvent<ProposalCreatedEventArgsArray & ProposalCreatedEventArgsObject>[],
  CompoundProposalType[],
  number[]
];

type ProposalDataType = {
  rawProposal: CompoundProposalType;
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

export async function getCompoundProposals(
  govVersion: GovVersion | undefined,
  compoundGovAddress: string,
  provider: providers.Web3Provider,
  models: DB
) {
  console.log(
    `Fetching Compound proposals for ${compoundGovAddress}, with gov version ${govVersion}`
  );
  let contract:
    | GovernorAlpha
    | GovernorBravoDelegate
    | GovernorCompatibilityBravo
    | Governor;
  let govVersionFinal = govVersion;
  if (!govVersion) {
    const result = await getCompoundGovContractAndVersion(
      compoundGovAddress,
      provider
    );
    contract = result.contract;
    govVersionFinal = result.version;
    // save the gov version to the db, so we don't need to find it again
    await models.Contract.update(
      { gov_version: result.version },
      { where: { address: compoundGovAddress } }
    );
  } else {
    contract = getCompoundGovContract(govVersion, compoundGovAddress, provider);
  }

  await contract.deployed();
  let proposalArrays: ResolvedProposalPromises;
  switch (govVersionFinal) {
    case GovVersion.Alpha:
      proposalArrays = await getProposalAsync(<GovernorAlpha>contract);
      break;
    case GovVersion.Bravo:
      proposalArrays = await getBravoProposals(<GovernorBravoDelegate>contract);
      break;
    case GovVersion.OzBravo:
      proposalArrays = await getProposalDataSequentially(
        <GovernorCompatibilityBravo>contract
      );
      break;
    case GovVersion.Oz:
      proposalArrays = await getProposalDataSequentially(<Governor>contract);
      break;
    default:
      throw new Error(`Invalid Compound contract version: ${govVersionFinal}`);
  }

  const [proposalCreatedEvents, proposals, proposalStates] = proposalArrays;

  const allProposalData: ProposalDataType[] = [];
  for (let i = 0; i < proposals.length; i++) {
    allProposalData.push({
      rawProposal: proposals[i],
      proposalState: proposalStates[i],
      proposalCreatedEvent: proposalCreatedEvents.find((p) =>
        p.args.id.eq(proposals[i].id)
      ),
    });
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
  initialProposalId = 0
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
  contract: GovernorCompatibilityBravo | Governor | GovernorBravoDelegate
): Promise<ResolvedProposalPromises> {
  console.log('Fetching proposal data sequentially');
  const proposalCreatedEvents = await getProposalCreatedEvents(contract);

  const proposalDataPromises: Promise<CompoundProposalType>[] = [];
  const proposalStatePromises: Promise<number>[] = [];
  for (const propCreatedEvent of proposalCreatedEvents) {
    proposalDataPromises.push(contract.proposals(propCreatedEvent.args.id));
    proposalStatePromises.push(contract.state(propCreatedEvent.args.id));
  }

  const [proposals, proposalStates] = await Promise.all([
    Promise.all(proposalDataPromises),
    Promise.all(proposalStatePromises),
  ]);

  return [proposalCreatedEvents, proposals, proposalStates];
}

/**
 * This function determines the initial proposal id and then calls getProposalAsync. This function is necessary to
 * support contract versions that don't exactly match Bravo. Such contracts (like impactmarket) generally follow the
 * Bravo contract interface, but don't have initialProposalId because they use sequential proposal ids starting from 0.
 * Therefore, for these contracts we attempt to fetch initialProposalId and if it doesn't exist, we start from 0.
 * @param contract
 */
async function getBravoProposals(
  contract: GovernorBravoDelegate
): Promise<ResolvedProposalPromises> {
  let initialProposalId = 0;
  try {
    // Some contracts like for impact market don't have initialProposalId and use proposal id's starting from 0
    initialProposalId = +(await contract.initialProposalId());
  } catch (e) {
    console.log(
      `initialProposalId does not exist on contract ${contract.address}. Using proposal id 0 as initialProposalId`
    );
  }

  return getProposalAsync(contract, initialProposalId);
}

/**
 * This function is used to map a Compound compatible event arg array to a fully functional event arg object.
 * Uses:
 * 1. Convert proposalId to id in OZ and OZ Bravo Compatibility event args
 * 2. Properly set calldatas in OZ Bravo Compatibility event args
 * @param event A Compound compatible proposal created event
 */
export function mapProposalCreatedEvent(
  event: TypedEvent<ProposalCreatedEventArgsArray & any>
): TypedEvent<ProposalCreatedEventArgsArray & ProposalCreatedEventArgsObject> {
  if (event.args.proposalId) {
    // original event is frozen/sealed so must clone it to modify it
    const result: any = cloneDeep(event);
    result.args.id = event.args.proposalId;
    result.args.calldatas = event.args[5];
    delete result.args.proposalId;
    return result;
  } else return event;
}

async function getProposalCreatedEvents(
  contract:
    | GovernorAlpha
    | GovernorBravoDelegate
    | GovernorCompatibilityBravo
    | Governor
): Promise<
  TypedEvent<ProposalCreatedEventArgsArray & ProposalCreatedEventArgsObject>[]
> {
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
      null
    ),
    0,
    'latest'
  );

  return events.map((e) => mapProposalCreatedEvent(e));
}

/**
 * This function determines which compound contract version is being used at the given address. Note that the returned
 * contract and gov version is not guaranteed to be an exact match. For example, impactmarket uses a mix of Alpha, Bravo
 * and Oz-Compatible Bravo contracts, but the returned contract will be a Bravo contract since that's what it most
 * closely matches. This function in now way affects what contract interface is chosen on the client. The purpose of
 * this function is to decide the best contract interface for fetching proposals. Ideally, proposal data is fetched at
 * the same time as proposal created events, but this is not possible for oz and oz-compatible bravo contracts since
 * they don't have sequential proposal ids.
 * @param compoundGovAddress
 * @param provider
 */
async function getCompoundGovContractAndVersion(
  compoundGovAddress: string,
  provider: providers.Web3Provider
): Promise<{
  version: GovVersion;
  contract:
    | GovernorAlpha
    | GovernorBravoDelegate
    | GovernorCompatibilityBravo
    | Governor;
}> {
  try {
    const contract = GovernorAlpha__factory.connect(
      compoundGovAddress,
      provider
    );
    await contract.guardian();
    return { version: GovVersion.Alpha, contract };
  } catch (e) {
    try {
      const contract = GovernorBravoDelegate__factory.connect(
        compoundGovAddress,
        provider
      );
      // OZ never uses proposalCount so default to bravo if proposalCount is defined so that we
      // can fetch proposal created events and proposal data simultaneously rather than sequentially
      await contract.proposalCount();
      return { version: GovVersion.Bravo, contract };
    } catch (e) {
      try {
        const contract = GovernorCompatibilityBravo__factory.connect(
          compoundGovAddress,
          provider
        );
        await contract.COUNTING_MODE();
        return { version: GovVersion.OzBravo, contract };
      } catch (e) {
        try {
          const contract = Governor__factory.connect(
            compoundGovAddress,
            provider
          );
          await contract.quorum(0);
          return { version: GovVersion.Oz, contract };
        } catch (e) {
          throw new Error(
            `Failed to find Compound contract version at ${compoundGovAddress}`
          );
        }
      }
    }
  }
}

function getCompoundGovContract(
  govVersion: GovVersion,
  compoundGovAddress: string,
  provider: providers.Web3Provider
) {
  switch (govVersion) {
    case GovVersion.Alpha:
      return GovernorAlpha__factory.connect(compoundGovAddress, provider);
    case GovVersion.Bravo:
      return GovernorBravoDelegate__factory.connect(
        compoundGovAddress,
        provider
      );
    case GovVersion.OzBravo:
      return GovernorCompatibilityBravo__factory.connect(
        compoundGovAddress,
        provider
      );
    case GovVersion.Oz:
      return Governor__factory.connect(compoundGovAddress, provider);
    default:
      throw new Error(`Invalid Compound contract version: ${govVersion}`);
  }
}
