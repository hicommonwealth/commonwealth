/**
 * The purpose of this file is to synthesize "events" from currently-present
 * chain data, such that we don't need to "start fresh". We can "recover" the
 * originating event of any present entity and use that to seed our database
 * when converting from a client-based chain listener setup to a server-based one.
 */
import { ApiPromise } from '@polkadot/api';
import { CWEvent, IChainEntityKind, IStorageFetcher } from '../../interfaces';
import { IDemocracyProposed, IDemocracyStarted, IDemocracyPassed, IPreimageNoted, ITreasuryProposed, ICollectiveProposed, ICollectiveVoted, ISignalingNewProposal, ISignalingCommitStarted, ISignalingVotingStarted, ISignalingVotingCompleted, IEventData, IIdentitySet, ITreasuryBountyEvents, INewTip, ITipVoted, ITipClosing } from './types';
export declare class StorageFetcher extends IStorageFetcher<ApiPromise> {
    protected readonly _api: ApiPromise;
    protected readonly log: any;
    constructor(_api: ApiPromise, chain?: string);
    fetchIdentities(addresses: string[]): Promise<CWEvent<IIdentitySet>[]>;
    fetchOne(id: string, kind: IChainEntityKind, moduleName?: 'council' | 'technicalCommittee'): Promise<CWEvent<IEventData>[]>;
    fetch(): Promise<CWEvent<IEventData>[]>;
    fetchDemocracyProposals(blockNumber: number, id?: string): Promise<CWEvent<IDemocracyProposed>[]>;
    fetchDemocracyReferenda(blockNumber: number, id?: string): Promise<CWEvent<IDemocracyStarted | IDemocracyPassed>[]>;
    fetchDemocracyPreimages(hashes: string[]): Promise<CWEvent<IPreimageNoted>[]>;
    fetchTreasuryProposals(blockNumber: number, id?: string): Promise<CWEvent<ITreasuryProposed>[]>;
    fetchBounties(blockNumber: number, id?: string): Promise<CWEvent<ITreasuryBountyEvents>[]>;
    fetchCollectiveProposals(moduleName: 'council' | 'technicalCommittee', blockNumber: number, id?: string): Promise<CWEvent<ICollectiveProposed | ICollectiveVoted>[]>;
    fetchTips(blockNumber: number, hash?: string): Promise<CWEvent<INewTip | ITipVoted | ITipClosing>[]>;
    fetchSignalingProposals(blockNumber: number, id?: string): Promise<CWEvent<ISignalingNewProposal | ISignalingCommitStarted | ISignalingVotingStarted | ISignalingVotingCompleted>[]>;
}
