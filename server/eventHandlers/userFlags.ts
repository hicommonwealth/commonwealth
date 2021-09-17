/**
 * Event handler that processes changes in validator and councillor sets
 * and updates user-related flags in the database accordingly.
 */
import { IEventHandler, CWEvent, IChainEventKind, SubstrateTypes } from '@commonwealth/chain-events';
import Sequelize from 'sequelize';
const Op = Sequelize.Op;

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain?: string,
  ) {
    super();
  }

  private async syncAddressFlags(flag: string, newList: string[], chain?: string) {
    const newChain = chain || this._chain

    // clear existing flags
    const oldInstances = await this._models.Address.findAll({
      where: {
        chain: newChain,
        [flag]: true,
      }
    });
    await Promise.all(oldInstances.map((c) => {
      c[flag] = false;
      return c.save();
    }));

    // add new councillor flags
    const newInstances = await this._models.Address.findAll({
      where: {
        chain: newChain,
        address: {
          [Op.in]: newList,
        }
      }
    });
    await Promise.all(newInstances.map((c) => {
      c[flag] = true;
      return c.save();
    }));
    log.info(`Cleared ${flag} on ${oldInstances.length} addresses and set on ${newInstances.length} addresses.`);
  }

  public async forceSync(councillors?: string[], validators?: string[], chain?: string) {
    const newChain = chain || this._chain

    if (councillors instanceof Array) {
      await this.syncAddressFlags('is_councillor', councillors, newChain);
    }
    if (validators instanceof Array) {
      await this.syncAddressFlags('is_validator', validators, newChain);
    }
  }

  public async handle(event: CWEvent, dbEvent) {
    const chain = event.chain || this._chain

    // handle new councillors
    if (event.data.kind === SubstrateTypes.EventKind.ElectionNewTerm
        || event.data.kind === SubstrateTypes.EventKind.ElectionEmptyTerm) {
      const councillors = event.data.kind === SubstrateTypes.EventKind.ElectionNewTerm
        ? event.data.allMembers : event.data.members;
      await this.syncAddressFlags('is_councillor', councillors, chain);
      return dbEvent;
    }

    // handle new validators
    if (event.data.kind === SubstrateTypes.EventKind.StakingElection) {
      const validators = event.data.validators;
      await this.syncAddressFlags('is_validator', validators, chain);
      return dbEvent;
    }
  }
}
