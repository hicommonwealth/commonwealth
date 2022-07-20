/**
 * Event handler that processes changes in validator and councillor sets
 * and updates user-related flags in the database accordingly.
 */
import {
  IEventHandler,
  CWEvent,
  SubstrateTypes,
} from '@commonwealth/chain-events';
import Sequelize from 'sequelize';
const Op = Sequelize.Op;

import { addPrefix, factory } from 'common-common/src/logging';

// A mapping of supported Event Kinds to create empty profiles for, along with
// the specific field to use in fetching the address.
const SUPPORTED_KIND_FIELDS = {
  [SubstrateTypes.EventKind.DemocracyProposed]: 'proposer',
  [SubstrateTypes.EventKind.DemocracySeconded]: 'who',
  [SubstrateTypes.EventKind.DemocracyVoted]: 'who',
  [SubstrateTypes.EventKind.VoteDelegated]: ['who', 'target'],
  [SubstrateTypes.EventKind.TreasuryProposed]: 'proposer',
  [SubstrateTypes.EventKind.ElectionCandidacySubmitted]: 'candidate',
  [SubstrateTypes.EventKind.CollectiveProposed]: 'proposer',
  [SubstrateTypes.EventKind.CollectiveVoted]: 'voter',
  [SubstrateTypes.EventKind.IdentitySet]: 'who',
};

export default class extends IEventHandler {
  public readonly name = 'Profile Creation';

  constructor(private readonly _models, private readonly _chain?: string) {
    super();
  }

  public async handle(event: CWEvent, dbEvent) {
    const log = factory.getLogger(addPrefix(__filename, [event.network, event.chain]));
    const chain = event.chain || this._chain;

    const fields = SUPPORTED_KIND_FIELDS[event.data.kind];
    if (!fields) {
      log.trace(`Unsupported profile-related event.`);
      return dbEvent;
    }

    // fetch all addresses that we want to check for
    const addresses = [];
    if (fields instanceof Array) {
      for (const field of fields) {
        addresses.push(event.data[field]);
      }
    } else {
      addresses.push(event.data[fields]);
    }

    // query for the addresses -- we skip them if they already exist
    for (const address of addresses) {
      let addressInstance = await this._models.Address.findOne({
        where: {
          address,
          chain,
        },
      });
      if (addressInstance) {
        log.trace(`Address model already exists.`);
        return;
      }

      // Address.createEmpty
      const verification_token = 'NO_USER';
      const verification_token_expires = new Date(); // expired immediately
      addressInstance = await this._models.Address.create({
        chain,
        address,
        verification_token,
        verification_token_expires
      });
      await this._models.OffchainProfile.create({
        address_id: addressInstance.id,
      });
      // NOTE: if creating from identity, then identity info will be set on profile
      //   in the "IdentityHandler", which must come after this handler in the order
      //   of events
    }
    return dbEvent;
  }
}
