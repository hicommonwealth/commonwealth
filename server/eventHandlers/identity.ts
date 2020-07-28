import _ from 'underscore';
import {
  IEventHandler,
  CWEvent,
  IChainEventData,
  SubstrateTypes
} from '@commonwealth/chain-events';
import { OffchainProfileInstance } from '../models/offchain_profile';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain: string,
  ) {
    super();
  }


  /**
   * Handles an identity-related event by writing the corresponding update into
   * the database.
   */
  public async handle(event: CWEvent<IChainEventData>, dbEvent) {
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
          chain: this._chain,
        },
        required: true,
      }]
    });
    if (!profile) return;

    // update profile data depending on event
    if (event.data.kind === SubstrateTypes.EventKind.IdentitySet) {
      profile.identity = event.data.displayName;
      profile.judgements = _.object<{ [name: string]: SubstrateTypes.IdentityJudgement }>(event.data.judgements);
      await profile.save();
    } else if (event.data.kind === SubstrateTypes.EventKind.JudgementGiven) {
      const judgements = profile.judgements;
      judgements[event.data.registrar] = event.data.judgement;
      await profile.save();
    } else {
      profile.identity = null;
      profile.judgements = null;
      await profile.save();
    }

    return dbEvent;
  }
}
