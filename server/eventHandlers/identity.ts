import _ from 'underscore';
import {
  IEventHandler,
  CWEvent,
  IChainEventData,
  SubstrateTypes
} from '@commonwealth/chain-events';
import { OffchainProfileInstance } from '../models/offchain_profile';
import { factory, formatFilename } from '../../shared/logging';
import { AccountId, IdentityJudgement } from '@commonwealth/chain-events/dist/chains/substrate/types';

const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain?: string,
  ) {
    super();
  }


  /**
   * Handles an identity-related event by writing the corresponding update into
   * the database.
   */
  public async handle(event: CWEvent<IChainEventData>, dbEvent) {
    const chain = event.chain || this._chain

    // do nothing if wrong type of event
    if (event.data.kind !== SubstrateTypes.EventKind.IdentitySet
        && event.data.kind !== SubstrateTypes.EventKind.JudgementGiven
        && event.data.kind !== SubstrateTypes.EventKind.IdentityCleared
        && event.data.kind !== SubstrateTypes.EventKind.IdentityKilled) {
      return dbEvent;
    }

    // fetch OffchainProfile corresponding to address
    const { who } = event.data;
    const profile: OffchainProfileInstance = await this._models.OffchainProfile.findOne({
      include: [{
        model: this._models.Address,
        where: {
          // TODO: do we need to modify address case?
          address: who,
          chain,
        },
        required: true,
      }]
    });
    if (!profile) return dbEvent;

    // update profile data depending on event
    if (event.data.kind === SubstrateTypes.EventKind.IdentitySet) {
      profile.identity = event.data.displayName;
      profile.judgements = _.object<[AccountId, IdentityJudgement][]>(event.data.judgements)
      await profile.save();

      // write a comment about the new identity
      let logName = profile.Address.address;
      if (profile.data) {
        const { name } = JSON.parse(profile.data);
        logName = name;
      }
      log.debug(`Discovered name '${profile.identity}' for ${logName}!`);
    } else if (event.data.kind === SubstrateTypes.EventKind.JudgementGiven) {
      // if we don't have an identity saved yet for a judgement, do nothing
      // TODO: we can augment the judgement event to include all event data, but seems
      //   unnecessary if we keep the migrations up to date
      if (!profile.identity) {
        log.warn('No corresponding identity found for judgement! Needs identity-migration?');
        return dbEvent;
      }
      if (!profile.judgements) {
        profile.set({ 'judgements': { [event.data.registrar]: event.data.judgement } });
      } else {
        const fieldName = `judgements.${event.data.registrar}`;
        profile.set({ [fieldName]: event.data.judgement });
      }
      await profile.save();
    } else {
      profile.identity = null;
      profile.judgements = null;
      await profile.save();
    }

    return dbEvent;
  }
}
