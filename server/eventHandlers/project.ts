import Web3 from 'web3';
import BN from 'bn.js';
import { providers } from 'ethers';
import {
  IEventHandler,
  CWEvent,
  IChainEventData,
  CommonwealthTypes,
} from '@commonwealth/chain-events';
import { ICuratedProject__factory } from '../../shared/eth/types';
import { addPrefix, factory } from '../../shared/logging';
import { DB, sequelize } from '../database';
import { ChainNodeAttributes } from '../models/chain_node';
export default class extends IEventHandler {
  public readonly name = 'Project';

  constructor(
    private readonly _models: DB,
    private readonly _node: ChainNodeAttributes
  ) {
    super();
  }

  /**
   * Handles a project-related event by writing the corresponding update into
   * the database.
   */
  public async handle(event: CWEvent<IChainEventData>, dbEvent) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const log = factory.getLogger(addPrefix(__filename, [event.network, event.chain]));

    if (event.data.kind === CommonwealthTypes.EventKind.ProjectCreated) {
      // handle creation event by checking against projects table
      const entityId = dbEvent?.entity_id;
      if (!entityId) {
        log.error(`Entity not found on dbEvent: ${dbEvent.toString()}`);
        return; // oops, should not happen
      }
      const index = event.data.index;

      // first, query data from contract
      const url = this._node.private_url;
      const provider = new Web3.providers.WebsocketProvider(url);
      const contractApi = ICuratedProject__factory.connect(
        event.data.id,
        new providers.Web3Provider(provider)
      );
      await contractApi.deployed();
      const token = await contractApi.acceptedToken();
      const curator_fee = await contractApi.curatorFee();
      const threshold = await contractApi.threshold();
      const deadline = await contractApi.deadline();
      const funding_amount = '0'; // TODO: should we query from contract?
      provider.disconnect(1000, 'finished');

      // then, create or update project row as needed,
      // transactionalized to ensure the find+create/update is atomic
      await sequelize.transaction(async (t) => {
        const projectRow = await this._models.Project.findOne({
          where: { project_id: +index },
          transaction: t
        });
        if (projectRow) {
          // update
          projectRow.entity_id = entityId;
          projectRow.token = token;
          projectRow.curator_fee = curator_fee;
          projectRow.threshold = threshold.toString();
          projectRow.deadline = deadline.toNumber();
          projectRow.funding_amount = funding_amount;
          await projectRow.save({ transaction: t });
        } else {
          // create
          await this._models.Project.create({
            project_id: +index,
            entity_id: entityId,
            token,
            curator_fee,
            threshold: threshold.toString(),
            deadline: deadline.toNumber(),
            funding_amount,
          }, { transaction: t });
        }
      });
    } else if (
      event.data.kind === CommonwealthTypes.EventKind.ProjectBacked ||
      event.data.kind === CommonwealthTypes.EventKind.ProjectCurated
    ) {
      // update funding amount in project
      const entityId = dbEvent?.entity_id;
      if (!entityId) {
        log.error(`Entity not found on dbEvent: ${dbEvent.toString()}`);
        return;
      }
      const amount = new BN(event.data.amount);
      const projectRow = await this._models.Project.findOne({
        where: { entity_id: entityId }
      });
      if (!projectRow) {
        log.error(`Entity not found for id: ${entityId}`);
        return;
      }
      const existingAmount = new BN(projectRow.funding_amount);
      const newAmount = existingAmount.add(amount);
      projectRow.funding_amount = newAmount.toString();
      await projectRow.save();
    }

    return dbEvent;
  }
}
