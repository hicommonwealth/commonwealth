import { Proposal } from 'cosmjs-types/cosmos/gov/v1beta1/gov';

import { CWEvent, IStorageFetcher, SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import { IEventData, EventKind, Api, ISubmitProposal } from './types';

const dateToUnix = (d?: Date): number | undefined => {
  if (d) return Math.floor(d.getTime() / 1000);
  return undefined;
};
export class StorageFetcher extends IStorageFetcher<Api> {
  private readonly log;

  constructor(protected readonly _api: Api, chain?: string) {
    super(_api);
    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Cosmos, chain])
    );
  }

  private _currentBlock: number;

  private _proposalToEvent(proposal: Proposal): CWEvent<ISubmitProposal> {
    return {
      // NOTE: we cannot query the actual submission block
      blockNumber: this._currentBlock,
      network: SupportedNetwork.Cosmos,
      data: {
        kind: EventKind.SubmitProposal,
        id: proposal.proposalId.toString(10),
        content: proposal.content,
        submitTime: dateToUnix(proposal.submitTime),
        depositEndTime: dateToUnix(proposal.depositEndTime),
        votingStartTime: dateToUnix(proposal.votingStartTime),
        votingEndTime: dateToUnix(proposal.votingEndTime),
        finalTallyResult: proposal.finalTallyResult,
        totalDeposit: proposal.totalDeposit,
      },
    };
  }

  public async fetchOne(id: string): Promise<CWEvent<IEventData>[]> {
    this._currentBlock = (await this._api.tm.block()).block.header.height;
    this.log.info(`Current block: ${this._currentBlock}.`);
    if (!this._currentBlock) {
      this.log.error('Failed to fetch current block! Aborting fetch.');
      return [];
    }

    const { proposal } = await this._api.lcd.gov.proposal(id);
    return [this._proposalToEvent(proposal)];
  }

  /**
   * Fetches all CW events relating to ChainEntities from chain (or in this case contract),
   *   by quering available chain/contract storage and reconstructing events.
   *
   * NOTE: throws on error! Make sure to wrap in try/catch!
   */
  public async fetch(): Promise<CWEvent<IEventData>[]> {
    this._currentBlock = (await this._api.tm.block()).block.header.height;
    this.log.info(`Current block: ${this._currentBlock}.`);
    if (!this._currentBlock) {
      this.log.error(`Failed to fetch current block! Aborting fetch.`);
      return [];
    }

    // we can only fetch created events, because of the constraints of cosmos' storage
    const { proposals, pagination } = await this._api.lcd.gov.proposals(
      0,
      '',
      ''
    );

    // fetch all proposals
    let { nextKey } = pagination;
    while (nextKey.length > 0) {
      const {
        proposals: addlProposals,
        pagination: nextPage,
      } = await this._api.lcd.gov.proposals(0, '', '', nextKey);
      proposals.push(...addlProposals);
      nextKey = nextPage.nextKey;
    }

    const proposalEvents = [];
    for (const proposal of proposals) {
      proposalEvents.push(this._proposalToEvent(proposal));
    }
    return proposalEvents;
  }
}
