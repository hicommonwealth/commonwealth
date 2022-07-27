import _ from 'underscore';
import {
  IEventHandler,
  CWEvent,
  IChainEventData,
  SubstrateTypes,
} from 'chain-events/src';
import { OffchainProfileInstance } from 'common-common/src/models/offchain_profile';
import { addPrefix, factory } from 'common-common/src/logging';

export default class extends IEventHandler {
  public readonly name = 'Identity';

  constructor(private readonly _models, private readonly _chain?: string) {
    super();
  }

  /**
   * Handles an identity-related event by writing the corresponding update into
   * the database.
   */
  public async handle(event: CWEvent<IChainEventData>, dbEvent) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const log = factory.getLogger(addPrefix(__filename, [event.network, event.chain]));

    const chain = event.chain || this._chain;

    // do nothing if wrong type of event
    if (
      event.data.kind !== SubstrateTypes.EventKind.IdentitySet &&
      event.data.kind !== SubstrateTypes.EventKind.JudgementGiven &&
      event.data.kind !== SubstrateTypes.EventKind.IdentityCleared &&
      event.data.kind !== SubstrateTypes.EventKind.IdentityKilled
    ) {
      return dbEvent;
    }

    // fetch OffchainProfile corresponding to address
    const { who } = event.data;
    const profile: OffchainProfileInstance =
      await this._models.OffchainProfile.findOne({
        include: [
          {
            model: this._models.Address,
            where: {
              // TODO: do we need to modify address case?
              address: who,
              chain,
            },
            required: true,
          },
        ],
      });
    if (!profile) return dbEvent;

    // update profile data depending on event
    if (event.data.kind === SubstrateTypes.EventKind.IdentitySet) {
      profile.identity = event.data.displayName;
      profile.judgements = _.object<{
        [registrar: string]: SubstrateTypes.IdentityJudgement;
      }>(event.data.judgements);
      await profile.save();

      // write a comment about the new identity
      let logName = profile.Address.address;
      if (profile.data) {
        const { name } = JSON.parse(profile.data);
        logName = name;
      }
      log.debug(
        `Discovered name '${profile.identity}' for ${logName}!`
      );
    } else if (event.data.kind === SubstrateTypes.EventKind.JudgementGiven) {
      // if we don't have an identity saved yet for a judgement, do nothing
      // TODO: we can augment the judgement event to include all event data, but seems
      //   unnecessary if we keep the migrations up to date
      if (!profile.identity) {
        log.warn(
          `No corresponding identity found for judgement! Needs identity-migration?`
        );
        return dbEvent;
      }
      if (!profile.judgements) {
        profile.set({
          judgements: { [event.data.registrar]: event.data.judgement },
        });
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
