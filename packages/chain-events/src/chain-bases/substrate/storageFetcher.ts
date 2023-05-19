/**
 * The purpose of this file is to synthesize "events" from currently-present
 * chain data, such that we don't need to "start fresh". We can "recover" the
 * originating event of any present entity and use that to seed our database
 * when converting from a client-based chain listener setup to a server-based one.
 */

import _ from 'underscore';
import type { ApiPromise } from '@polkadot/api';
import type { Option, Vec } from '@polkadot/types';
import type {
  BalanceOf,
  AccountId,
  Hash,
  BlockNumber,
  Registration,
  TreasuryProposal,
  Proposal,
  Votes,
  PropIndex,
  OpenTip,
} from '@polkadot/types/interfaces';
import type { Codec } from '@polkadot/types/types';
import type { DeriveProposalImage } from '@polkadot/api-derive/types';
import { isFunction, hexToString } from '@polkadot/util';

import type { CWEvent, IChainEntityKind } from '../../interfaces';
import { IStorageFetcher, SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import type {
  IDemocracyProposed,
  IDemocracyStarted,
  IDemocracyPassed,
  IPreimageNoted,
  ITreasuryProposed,
  IEventData,
  IIdentitySet,
  IdentityJudgement,
  INewTip,
  ITipVoted,
  ITipClosing,
} from './types';
import { EventKind, parseJudgement, EntityKind } from './types';

export class StorageFetcher extends IStorageFetcher<ApiPromise> {
  protected readonly log;

  constructor(protected readonly _api: ApiPromise, origin?: string) {
    super(_api);
    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Substrate, origin])
    );
  }

  public async fetchIdentities(
    addresses: string[]
  ): Promise<CWEvent<IIdentitySet>[]> {
    if (!this._api.query.identity) {
      this.log.info('Identities module not detected.');
      return [];
    }

    const blockNumber = +(await this._api.rpc.chain.getHeader()).number;

    // fetch all identities and registrars from chain
    const identities: Option<Registration>[] =
      await this._api.query.identity.identityOf.multi(addresses);
    const registrars = await this._api.query.identity.registrars();

    // construct events
    const cwEvents: CWEvent<IIdentitySet>[] = _.zip(addresses, identities)
      .map(
        ([address, id]: [
          string,
          Option<Registration>
        ]): CWEvent<IIdentitySet> => {
          // if no identity found, do nothing
          if (!id.isSome) return null;
          const { info, judgements } = id.unwrap();
          if (!info.display || !info.display.isRaw) return null;

          // parse out judgements from identity info
          const parsedJudgements = judgements
            .map(([judgmentId, judgement]): [string, IdentityJudgement] => {
              const registrarOpt = registrars[+judgmentId];
              // skip invalid registrars
              if (!registrarOpt || !registrarOpt.isSome) return null;
              return [
                registrarOpt.unwrap().account.toString(),
                parseJudgement(judgement),
              ];
            })
            .filter((j) => !!j);
          return {
            // use current block as "fake" set date
            blockNumber,
            network: SupportedNetwork.Substrate,
            data: {
              kind: EventKind.IdentitySet,
              who: address,
              displayName: info.display.asRaw.toUtf8(),
              judgements: parsedJudgements,
            },
          };
        }
      )
      // remove null values
      .filter((v) => !!v);
    return cwEvents;
  }

  public async fetchOne(
    id: string,
    kind: IChainEntityKind,
    moduleName?: 'council' | 'technicalCommittee'
  ): Promise<CWEvent<IEventData>[]> {
    if (!Object.values(EntityKind).find((k) => k === kind)) {
      this.log.error(`Invalid entity kind: ${kind}`);
      return [];
    }
    const blockNumber = +(await this._api.rpc.chain.getHeader()).number;
    switch (kind as EntityKind) {
      case EntityKind.DemocracyPreimage:
        return this.fetchDemocracyPreimages([id]);
      case EntityKind.DemocracyProposal:
        return this.fetchDemocracyProposals(blockNumber, id);
      case EntityKind.DemocracyReferendum:
        return this.fetchDemocracyReferenda(blockNumber, id);
      case EntityKind.TreasuryProposal:
        return this.fetchTreasuryProposals(blockNumber, id);
      case EntityKind.TipProposal:
        return this.fetchTips(blockNumber, id);
      default:
        return null;
    }
  }

  public async fetch(): Promise<CWEvent<IEventData>[]> {
    // get current blockNumber for synthesizing events
    const blockNumber = +(await this._api.rpc.chain.getHeader()).number;

    /** democracy proposals */
    const democracyProposalEvents = await this.fetchDemocracyProposals(
      blockNumber
    );

    /** democracy referenda */
    const democracyReferendaEvents = await this.fetchDemocracyReferenda(
      blockNumber
    );

    /** democracy preimages */
    const proposalHashes = democracyProposalEvents.map(
      (d) => (d.data as IDemocracyProposed).proposalHash
    );
    const referendaHashes = democracyReferendaEvents
      .filter((d) => d.data.kind === EventKind.DemocracyStarted)
      .map((d) => (d.data as IDemocracyStarted).proposalHash);
    const democracyPreimageEvents = await this.fetchDemocracyPreimages([
      ...proposalHashes,
      ...referendaHashes,
    ]);

    /** treasury proposals */
    const treasuryProposalEvents = await this.fetchTreasuryProposals(
      blockNumber
    );

    /** tips */
    const tipsEvents = await this.fetchTips(blockNumber);

    this.log.info('Fetch complete.');
    return [
      ...democracyProposalEvents,
      ...democracyReferendaEvents,
      ...democracyPreimageEvents,
      ...treasuryProposalEvents,
      ...tipsEvents,
    ];
  }

  public async fetchDemocracyProposals(
    blockNumber: number,
    id?: string
  ): Promise<CWEvent<IDemocracyProposed>[]> {
    if (!this._api.query.democracy) {
      return [];
    }
    this.log.info('Migrating democracy proposals...');
    const publicProps = await this._api.query.democracy.publicProps();
    const constructEvent = (
      prop: [PropIndex, Hash, AccountId] & Codec,
      depositOpt: Option<[Vec<AccountId> | BalanceOf, BalanceOf] & Codec>
    ): IDemocracyProposed => {
      if (!depositOpt.isSome) return null;

      // handle kusama vs edgeware depositOpt order
      const depositors = depositOpt.unwrap();
      let deposit: BalanceOf;
      if (isFunction((depositors[0] as BalanceOf).mul)) {
        [deposit] = depositors as [BalanceOf, unknown] & Codec;
      } else {
        [, deposit] = depositors;
      }
      return {
        kind: EventKind.DemocracyProposed,
        proposalIndex: +prop[0],
        proposalHash: prop[1].toString(),
        proposer: prop[2].toString(),
        deposit: deposit.toString(),
      };
    };
    if (id === undefined) {
      const deposits: Array<Option<[BalanceOf, Vec<AccountId>] & Codec>> =
        await this._api.queryMulti(
          publicProps.map(([idx]) => [this._api.query.democracy.depositOf, idx])
        );
      const proposedEvents = _.zip(publicProps, deposits)
        .map(([prop, depositOpt]) => constructEvent(prop, depositOpt))
        .filter((e) => !!e);
      this.log.info(`Found ${proposedEvents.length} democracy proposals!`);
      return proposedEvents.map((data) => ({
        blockNumber,
        network: SupportedNetwork.Substrate,
        data,
      }));
      // eslint-disable-next-line no-else-return
    } else {
      const publicProp = publicProps.find(([idx]) => +idx === +id);
      if (!publicProp) {
        this.log.error(`Democracy proposal ${id} not found!`);
        return null;
      }
      const depositOpt = await this._api.query.democracy.depositOf(
        publicProp[0]
      );
      const evt = constructEvent(publicProp, depositOpt);
      return [
        {
          blockNumber,
          network: SupportedNetwork.Substrate,
          data: evt,
        },
      ];
    }
  }

  public async fetchDemocracyReferenda(
    blockNumber: number,
    id?: string
  ): Promise<CWEvent<IDemocracyStarted | IDemocracyPassed>[]> {
    if (!this._api.query.democracy) {
      this.log.info('Democracy module not detected.');
      return [];
    }

    this.log.info('Migrating democracy referenda...');
    const activeReferenda =
      await this._api.derive.democracy.referendumsActive();
    const startEvents = activeReferenda.map((r) => {
      return {
        kind: EventKind.DemocracyStarted,
        referendumIndex: +r.index,
        proposalHash: r.imageHash.toString(),
        voteThreshold: r.status.threshold.toString(),
        endBlock: +r.status.end,
      } as IDemocracyStarted;
    });
    const dispatchQueue = await this._api.derive.democracy.dispatchQueue();
    const passedEvents: Array<IDemocracyStarted | IDemocracyPassed> = _.flatten(
      dispatchQueue.map(({ index, at, imageHash }) => {
        return [
          {
            kind: EventKind.DemocracyStarted,
            referendumIndex: +index,
            proposalHash: imageHash.toString(),

            // fake unknown values for started event
            voteThreshold: '',
            endBlock: 0,
          } as IDemocracyStarted,
          {
            kind: EventKind.DemocracyPassed,
            referendumIndex: +index,
            dispatchBlock: +at,
          } as IDemocracyPassed,
        ];
      })
    );
    const results = [...startEvents, ...passedEvents].map((data) => ({
      blockNumber,
      network: SupportedNetwork.Substrate,
      data,
    }));

    // no easier way to only fetch one than to fetch em all
    if (id !== undefined) {
      const data = results.filter(
        ({ data: { referendumIndex } }) => referendumIndex === +id
      );
      if (data.length === 0) {
        this.log.error(`No referendum found with id ${id}!`);
        return null;
      }
      return data;
    }
    this.log.info(`Found ${startEvents.length} democracy referenda!`);
    return results;
  }

  // must pass proposal hashes found in prior events
  public async fetchDemocracyPreimages(
    hashes: string[]
  ): Promise<CWEvent<IPreimageNoted>[]> {
    if (!this._api.query.democracy) {
      return [];
    }
    this.log.info('Migrating preimages...');
    // eslint-disable-next-line
    // @ts-ignore
    const hashCodecs = hashes.map((hash) => this._api.createType('Hash', hash));
    const preimages = await this._api.derive.democracy.preimages(hashCodecs);
    const notedEvents: Array<[number, IPreimageNoted]> = _.zip(
      hashes,
      preimages
    ).map(([hash, preimage]: [string, DeriveProposalImage]) => {
      if (!preimage || !preimage.proposal) return [0, null];
      return [
        +preimage.at,
        {
          kind: EventKind.PreimageNoted,
          proposalHash: hash,
          noter: preimage.proposer.toString(),
          preimage: {
            method: preimage.proposal.method,
            section: preimage.proposal.section,
            args: preimage.proposal.args.map((arg) => arg.toString()),
          },
        } as IPreimageNoted,
      ];
    });
    const cwEvents = notedEvents
      .filter(([, data]) => !!data)
      .map(([blockNumber, data]) => ({
        blockNumber,
        network: SupportedNetwork.Substrate,
        data,
      }));
    this.log.info(`Found ${cwEvents.length} preimages!`);
    return cwEvents;
  }

  public async fetchTreasuryProposals(
    blockNumber: number,
    id?: string
  ): Promise<CWEvent<ITreasuryProposed>[]> {
    if (!this._api.query.treasury) {
      this.log.info('Treasury module not detected.');
      return [];
    }

    this.log.info('Migrating treasury proposals...');
    const approvals = await this._api.query.treasury.approvals();
    const nProposals = await this._api.query.treasury.proposalCount();

    if (id !== undefined) {
      const proposal = await this._api.query.treasury.proposals(+id);
      if (!proposal.isSome) {
        this.log.error(`No treasury proposal found with id ${id}!`);
        return null;
      }
      const { proposer, value, beneficiary, bond } = proposal.unwrap();
      return [
        {
          blockNumber,
          network: SupportedNetwork.Substrate,
          data: {
            kind: EventKind.TreasuryProposed,
            proposalIndex: +id,
            proposer: proposer.toString(),
            value: value.toString(),
            beneficiary: beneficiary.toString(),
            bond: bond.toString(),
          },
        },
      ];
    }

    const proposalIds: number[] = [];
    for (let i = 0; i < +nProposals; i++) {
      if (!approvals.some((idx) => +idx === i)) {
        proposalIds.push(i);
      }
    }

    const proposals = await this._api.query.treasury.proposals.multi<
      Option<TreasuryProposal>
    >(proposalIds);
    const proposedEvents = proposalIds
      .map((idx, index) => {
        if (!proposals[index] || !proposals[index].isSome) return null;
        const { proposer, value, beneficiary, bond } =
          proposals[index].unwrap();
        return {
          kind: EventKind.TreasuryProposed,
          proposalIndex: +idx,
          proposer: proposer.toString(),
          value: value.toString(),
          beneficiary: beneficiary.toString(),
          bond: bond.toString(),
        } as ITreasuryProposed;
      })
      .filter((e) => !!e);
    this.log.info(`Found ${proposedEvents.length} treasury proposals!`);
    return proposedEvents.map((data) => ({
      blockNumber,
      network: SupportedNetwork.Substrate,
      data,
    }));
  }

  public async fetchTips(
    blockNumber: number,
    hash?: string
  ): Promise<CWEvent<INewTip | ITipVoted | ITipClosing>[]> {
    if (!this._api.query.tips) {
      this.log.info('Tips module not detected.');
      return [];
    }

    this.log.info('Migrating tips...');
    const openTipKeys = await this._api.query.tips.tips.keys();
    const results: CWEvent<INewTip | ITipVoted | ITipClosing>[] = [];
    for (const key of openTipKeys) {
      const h = key.args[0].toString();
      // support fetchOne
      if (!hash || hash === h) {
        try {
          const tip = await this._api.rpc.state.getStorage<Option<OpenTip>>(
            key
          );
          if (tip.isSome) {
            const {
              reason: reasonHash,
              who,
              finder,
              deposit,
              closes,
              tips: tipVotes,
              findersFee,
            } = tip.unwrap();
            const reason = await this._api.query.tips.reasons(reasonHash);
            if (reason.isSome) {
              // newtip events
              results.push({
                blockNumber,
                network: SupportedNetwork.Substrate,
                data: {
                  kind: EventKind.NewTip,
                  proposalHash: h,
                  who: who.toString(),
                  reason: hexToString(reason.unwrap().toString()),
                  finder: finder.toString(),
                  deposit: deposit.toString(),
                  findersFee: findersFee.valueOf(),
                },
              });

              // n tipvoted events
              for (const [voter, amount] of tipVotes) {
                results.push({
                  blockNumber,
                  network: SupportedNetwork.Substrate,
                  data: {
                    kind: EventKind.TipVoted,
                    proposalHash: h,
                    who: voter.toString(),
                    value: amount.toString(),
                  },
                });
              }

              // tipclosing event
              if (closes.isSome) {
                const closesAt = +closes.unwrap();
                results.push({
                  blockNumber,
                  network: SupportedNetwork.Substrate,
                  data: {
                    kind: EventKind.TipClosing,
                    proposalHash: h,
                    closing: closesAt,
                  },
                });
              }
            }
          }
        } catch (e) {
          this.log.error(`Unable to fetch tip "${key.args[0]}"!`);
        }
      }
    }

    const newTips = results.filter((v) => v.data.kind === EventKind.NewTip);
    this.log.info(`Found ${newTips.length} open tips!`);
    return results;
  }
}
