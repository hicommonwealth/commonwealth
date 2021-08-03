import { SubstrateTypes } from '@commonwealth/chain-events';
import { CWEvent, IChainEventData, IEventHandler } from '@commonwealth/chain-events';
// @ts-ignore
import _ from 'underscore';
import format from 'pg-format';

export default class extends IEventHandler {
  private _pool;

  constructor(private readonly pool) {
    super();
    this._pool = pool;
  }

  /**pg
   * Handles an identity-related event by writing the corresponding update into
   * the database.
   */
  public async handle(event: CWEvent<IChainEventData>, dbEvent) {
    // do nothing if wrong type of event
    if (
      event.data.kind !== SubstrateTypes.EventKind.IdentitySet &&
      event.data.kind !== SubstrateTypes.EventKind.JudgementGiven &&
      event.data.kind !== SubstrateTypes.EventKind.IdentityCleared &&
      event.data.kind !== SubstrateTypes.EventKind.IdentityKilled
    ) {
      return dbEvent;
    }

    if (!this._pool) {
      console.info('PG pool not initialized');
      return dbEvent;
    }

    try {
      // fetch address_id from the Addresses table
      const { who } = event.data;

      let query = format(
        `SELECT * FROM "Addresses" WHERE "address"=%L AND "chain"=%L;`,
        who,
        event.chain
      );
      const profiles = (await this._pool.query(query)).rows;

      if (profiles.length == 0) return dbEvent;

      // update profile data depending on event
      if (event.data.kind === SubstrateTypes.EventKind.IdentitySet) {
        query = format(
          `UPDATE "OffchainProfiles" SET "identity"=%L, "judgements"=%L WHERE "address_id"=%L;`,
          event.data.displayName,
          _.object<any>(event.data.judgements),
          profiles[0].id
        );
        await this._pool.query(query);

        let logName = who;
        if (profiles[0].data) {
          const { name } = JSON.parse(profiles[0].data);
          logName = name;
        }
        console.debug(
          `Discovered name '${event.data.displayName}' for ${logName}!`
        );
      } else if (event.data.kind === SubstrateTypes.EventKind.JudgementGiven) {
        // check if there is already an identity
        query = format(
          `SELECT * FROM "OffchainProfiles" WHERE "address_id"=%L`,
          profiles[0].id
        );
        const offChainProfile = (await this._pool.query(query)).rows;

        if (!offChainProfile || offChainProfile.length == 0)
          console.log(`No off-chain profile for ${profiles[0].address}`);

        // if we don't have an identity saved yet for a judgement, do nothing
        if (!offChainProfile.identity) {
          console.warn(
            'No corresponding identity found for judgement! Needs identity-migration?'
          );
          return dbEvent;
        }
        query = format(
          `UPDATE "OffchainProfiles" SET "judgements"=%L WHERE "address_id"=%L;`,
          { [event.data.registrar]: event.data.judgement },
          profiles[0].id
        );
        await this._pool.query(query);
      } else {
        query = format(
          `UPDATE "OffchainProfiles" SET "identity"=%L,"judgements"=%L WHERE "address_id"=%L;`,
          null,
          null,
          profiles[0].id
        );
        await this._pool.query(query);
      }
    } catch (error) {
      throw error;
    }

    return dbEvent;
  }
}
