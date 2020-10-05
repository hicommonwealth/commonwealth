/**
 * The purpose of this file is to synthesize "events" from currently-present
 * chain data, such that we don't need to "start fresh". We can "recover" the
 * originating event of any present entity and use that to seed our database
 * when converting from a client-based chain listener setup to a server-based one.
 */

import _ from 'underscore';
import { ApiPromise } from '@polkadot/api';
import { Option, Vec } from '@polkadot/types';
import { BalanceOf, AccountId, Hash, BlockNumber, Registration } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import { DeriveProposalImage } from '@polkadot/api-derive/types';
import { isFunction } from '@polkadot/util';
import { ProposalRecord, VoteRecord } from '@edgeware/node-types';

import { CWEvent, IStorageFetcher } from '../interfaces';
import {
  EventKind,
  IDemocracyProposed,
  IDemocracyStarted,
  IDemocracyPassed,
  IPreimageNoted,
  ITreasuryProposed,
  ICollectiveProposed,
  ICollectiveVoted,
  ISignalingNewProposal,
  ISignalingCommitStarted,
  ISignalingVotingStarted,
  ISignalingVotingCompleted,
  IEventData,
  IIdentitySet,
  parseJudgement,
  IdentityJudgement,
} from './types';

import { factory, formatFilename } from '../logging';
const log = factory.getLogger(formatFilename(__filename));

export class StorageFetcher extends IStorageFetcher<ApiPromise> {
  public async fetchIdentities(addresses: string[]): Promise<CWEvent<IIdentitySet>[]> {
    const blockNumber = +(await this._api.rpc.chain.getHeader()).number;

    // fetch all identities and registrars from chain
    const identities: Option<Registration>[] = await this._api.query.identity.identityOf.multi(addresses);
    const registrars = await this._api.query.identity.registrars();

    // construct events
    const cwEvents: CWEvent<IIdentitySet>[] = _.zip(addresses, identities)
      .map(([ address, id ]: [ string, Option<Registration> ]): CWEvent<IIdentitySet> => {
        // if no identity found, do nothing
        if (!id.isSome) return null;
        const { info, judgements } = id.unwrap();
        if (!info.display || !info.display.isRaw) return null;

        // parse out judgements from identity info
        const parsedJudgements = judgements
          .map(([ id, judgement ]): [ string, IdentityJudgement ] => {
            const registrarOpt = registrars[+id];
            // skip invalid registrars
            if (!registrarOpt || !registrarOpt.isSome) return null;
            return [ registrarOpt.unwrap().account.toString(), parseJudgement(judgement) ];
          })
          .filter((j) => !!j);
        return {
          // use current block as "fake" set date
          blockNumber,
          data: {
            kind: EventKind.IdentitySet,
            who: address,
            displayName: info.display.asRaw.toUtf8(),
            judgements: parsedJudgements,
          }
        };
      })
      // remove null values
      .filter((v) => !!v);
    return cwEvents;
  }

  public async fetch(): Promise<CWEvent<IEventData>[]> {
    // get current blockNumber for synthesizing events
    const blockNumber = +(await this._api.rpc.chain.getHeader()).number;

    /** democracy proposals */
    const democracyProposalEvents = await this.fetchDemocracyProposals(blockNumber);

    /** democracy referenda */
    const democracyReferendaEvents = await this.fetchDemocracyReferenda(blockNumber);

    /** democracy preimages */
    const proposalHashes = democracyProposalEvents
      .map((d) => (d.data as IDemocracyStarted).proposalHash);
    const referendaHashes = democracyReferendaEvents
      .filter((d) => d.data.kind === EventKind.DemocracyStarted)
      .map((d) => (d.data as IDemocracyStarted).proposalHash);
    const democracyPreimageEvents = await this.fetchDemocracyPreimages([ ...proposalHashes, ...referendaHashes ]);

    /** treasury proposals */
    const treasuryProposalEvents = await this.fetchTreasuryProposals(blockNumber);

    /** collective proposals */
    let technicalCommitteeProposalEvents = [];
    if (this._api.query.technicalCommittee) {
      technicalCommitteeProposalEvents = await this.fetchCollectiveProposals('technicalCommittee', blockNumber);
    }
    const councilProposalEvents = await this.fetchCollectiveProposals('council', blockNumber);

    /** signaling proposals */
    const signalingProposalEvents = await this.fetchSignalingProposals(blockNumber);

    log.info('Fetch complete.');
    return [
      ...democracyProposalEvents,
      ...democracyReferendaEvents,
      ...democracyPreimageEvents,
      ...treasuryProposalEvents,
      ...technicalCommitteeProposalEvents,
      ...councilProposalEvents,
      ...signalingProposalEvents,
    ];
  }

  public async fetchDemocracyProposals(blockNumber: number): Promise<CWEvent<IEventData>[]> {
    log.info('Fetching democracy proposals...');
    const publicProps = await this._api.query.democracy.publicProps();
    const deposits: Array<Option<[BalanceOf, Vec<AccountId>] & Codec>> = await this._api.queryMulti(
      publicProps.map(([ idx ]) => [ this._api.query.democracy.depositOf, idx ])
    );
    const proposedEvents = _.zip(publicProps, deposits)
      .map(([ [ idx, hash, proposer ], depositOpt ]): IDemocracyProposed => {
        if (!depositOpt.isSome) return null;

        // handle kusama vs edgeware depositOpt order
        const depositors = depositOpt.unwrap();
        let deposit: BalanceOf;
        if (isFunction((depositors[1] as BalanceOf).mul)) {
          deposit = depositors[1];
        } else {
          deposit = depositors[0];
        }
        return {
          kind: EventKind.DemocracyProposed,
          proposalIndex: +idx,
          proposalHash: hash.toString(),
          proposer: proposer.toString(),
          deposit: deposit.toString(),
        };
      })
      .filter((e) => !!e);
    log.info(`Found ${proposedEvents.length} democracy proposals!`);
    return proposedEvents.map((data) => ({ blockNumber, data }));
  }

  public async fetchDemocracyReferenda(blockNumber: number): Promise<CWEvent<IEventData>[]> {
    log.info('Migrating democracy referenda...');
    const activeReferenda = await this._api.derive.democracy.referendumsActive();
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
          } as IDemocracyPassed
        ];
      })
    );
    log.info(`Found ${startEvents.length} democracy referenda!`);
    return [ ...startEvents, ...passedEvents ].map((data) => ({ blockNumber, data }));
  }

  // must pass proposal hashes found in prior events
  public async fetchDemocracyPreimages(hashes: string[]): Promise<CWEvent<IEventData>[]> {
    log.info('Migrating preimages...');
    const hashCodecs = hashes.map((hash) => this._api.createType('Hash', hash));
    const preimages = await this._api.derive.democracy.preimages(hashCodecs);
    const notedEvents: Array<[ number, IPreimageNoted ]> = _.zip(hashes, preimages)
      .map(([ hash, preimage ]: [ string, DeriveProposalImage ]) => {
        if (!preimage || !preimage.proposal) return [ 0, null ];
        return [ +preimage.at, {
          kind: EventKind.PreimageNoted,
          proposalHash: hash,
          noter: preimage.proposer.toString(),
          preimage: {
            method: preimage.proposal.methodName,
            section: preimage.proposal.sectionName,
            args: preimage.proposal.args.map((arg) => arg.toString()),
          }
        } as IPreimageNoted ];
      });
    const cwEvents = notedEvents
      .filter(([ blockNumber, data ]) => !!data)
      .map(([ blockNumber, data ]) => ({ blockNumber, data }));
    log.info(`Found ${cwEvents.length} preimages!`);
    return cwEvents;
  }

  public async fetchTreasuryProposals(blockNumber: number): Promise<CWEvent<IEventData>[]> {
    log.info('Migrating treasury proposals...');
    const proposals = await this._api.derive.treasury.proposals();
    const proposedEvents = proposals.proposals.map((p) => {
      return {
        kind: EventKind.TreasuryProposed,
        proposalIndex: +p.id,
        proposer: p.proposal.proposer.toString(),
        value: p.proposal.value.toString(),
        beneficiary: p.proposal.beneficiary.toString(),
        bond: p.proposal.bond.toString(),
      } as ITreasuryProposed;
    });
    log.info(`Found ${proposedEvents.length} treasury proposals!`);
    return proposedEvents.map((data) => ({ blockNumber, data }));
  }

  public async fetchCollectiveProposals(
    moduleName: 'council' | 'technicalCommittee', blockNumber: number
  ): Promise<CWEvent<IEventData>[]> {
    log.info(`Migrating ${moduleName} proposals...`);
    const proposals = await this._api.derive[moduleName].proposals();
    const proposedEvents = proposals.filter((p) => p.proposal && p.votes)
      .map((p) => {
        return {
          kind: EventKind.CollectiveProposed,
          collectiveName: moduleName,
          proposalIndex: +p.votes.index,
          proposalHash: p.hash.toString(),
          threshold: +p.votes.threshold,
          call: {
            method: p.proposal.methodName,
            section: p.proposal.sectionName,
            args: p.proposal.args.map((arg) => arg.toString()),
          },

          // unknown
          proposer: '',
        } as ICollectiveProposed;
      });
    const votedEvents = _.flatten(proposals.filter((p) => p.proposal && p.votes)
      .map((p) => {
        return [
          ...p.votes.ayes.map((who) => ({
            kind: EventKind.CollectiveVoted,
            collectiveName: moduleName,
            proposalHash: p.hash.toString(),
            voter: who.toString(),
            vote: true,
          } as ICollectiveVoted)),
          ...p.votes.nays.map((who) => ({
            kind: EventKind.CollectiveVoted,
            collectiveName: moduleName,
            proposalHash: p.hash.toString(),
            voter: who.toString(),
            vote: false,
          } as ICollectiveVoted)),
        ];
      }));
    log.info(`Found ${proposedEvents.length} ${moduleName} proposals and ${votedEvents.length} votes!`);
    return [...proposedEvents, ...votedEvents].map((data) => ({ blockNumber, data }));
  }

  public async fetchSignalingProposals(blockNumber: number): Promise<CWEvent<IEventData>[]> {
    log.info('Migrating signaling proposals...');
    if (!this._api.query.voting || !this._api.query.signaling) {
      log.info('Found no signaling proposals (wrong chain)!');
      return [];
    }
    // in "prevoting" phase
    const inactiveProposals = await this._api.query.signaling.inactiveProposals<Vec<[Hash, BlockNumber] & Codec>>();
    // in "commit" or "voting" phase
    const activeProposals = await this._api.query.signaling.activeProposals<Vec<[Hash, BlockNumber] & Codec>>();
    // in "completed" phase
    const completedProposals = await this._api.query.signaling.completedProposals<Vec<[Hash, BlockNumber] & Codec>>();
    const proposalHashes = [...inactiveProposals, ...activeProposals, ...completedProposals].map(([ hash ]) => hash);

    // fetch records
    const proposalRecordOpts: Array<Option<ProposalRecord>> = await this._api.queryMulti(
      proposalHashes.map((hash) => [ this._api.query.signaling.proposalOf, hash ])
    );
    const proposalRecords: Array<[ ProposalRecord, Hash ]> = _.zip(proposalRecordOpts, proposalHashes)
      .filter(([ p ]: [ Option<ProposalRecord> ]) => p.isSome)
      .map(([ p, hash ]: [ Option<ProposalRecord>, Hash ]) => [ p.unwrap(), hash ]);
    const voteRecordOpts: Array<Option<VoteRecord>> = await this._api.queryMulti(
      proposalRecords.map(([ p ]) => [ this._api.query.voting.voteRecords, p.vote_id ])
    );
    const allRecords: Array<[ Hash, ProposalRecord, VoteRecord ]> = _.zip(proposalRecords, voteRecordOpts)
      .filter(([ [ record, hash ], voteOpt ]: [ [ ProposalRecord, Hash ], Option<VoteRecord> ]) => voteOpt.isSome)
      .map(([ [ record, hash ], vote ]: [ [ ProposalRecord, Hash ], Option<VoteRecord> ]) => [
        hash, record, vote.unwrap()
      ]);

    // generate events
    const newProposalEvents = allRecords.map(([ hash, proposal, voting ]) => {
      return {
        kind: EventKind.SignalingNewProposal,
        proposer: proposal.author.toString(),
        proposalHash: hash.toString(),
        voteId: voting.id.toString(),
        title: proposal.title.toString(),
        description: proposal.contents.toString(),
        tallyType: voting.data.tally_type.toString(),
        voteType: voting.data.vote_type.toString(),
        choices: voting.outcomes.map((outcome) => outcome.toString()),
      } as ISignalingNewProposal;
    });

    // we're not using commit in production, but check anyway
    const commitStartedEvents = allRecords
      .filter(([ hash, proposal ]) => proposal.stage.isCommit)
      .map(([ hash, proposal, voting ]) => {
        return {
          kind: EventKind.SignalingCommitStarted,
          proposalHash: hash.toString(),
          voteId: voting.id.toString(),
          endBlock: +proposal.transition_time,
        } as ISignalingCommitStarted;
      });

    // assume all voting/completed proposals skipped straight there without commit
    const votingStartedEvents = allRecords
      .filter(([ hash, proposal ]) => proposal.stage.isVoting || proposal.stage.isCompleted)
      .map(([ hash, proposal, voting ]) => {
        return {
          kind: EventKind.SignalingVotingStarted,
          proposalHash: hash.toString(),
          voteId: voting.id.toString(),
          endBlock: +proposal.transition_time,
        } as ISignalingVotingStarted;
      });

    const completedEvents = allRecords
      .filter(([ hash, proposal ]) => proposal.stage.isCompleted)
      .map(([ hash, proposal, voting ]) => {
        return {
          kind: EventKind.SignalingVotingCompleted,
          proposalHash: hash.toString(),
          voteId: voting.id.toString(),
        } as ISignalingVotingCompleted;
      });

    const events = [...newProposalEvents, ...commitStartedEvents, ...votingStartedEvents, ...completedEvents];
    // we could plausibly populate the completed events with block numbers, but not necessary
    log.info(`Found ${newProposalEvents.length} signaling proposals!`);
    return events.map((data) => ({ blockNumber, data }));
  }
}
