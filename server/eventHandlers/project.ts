import BN from 'bn.js';
import {
  IEventHandler,
  CWEvent,
  IChainEventData,
  CommonwealthTypes,
} from '@commonwealth/chain-events';
import { addPrefix, factory } from '../../shared/logging';
import { DB } from '../database';

export default class extends IEventHandler {
  public readonly name = 'Project';

  constructor(
    private readonly _models: DB
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
      const ipfsHash = event.data.ipfsHash;

      const projectRow = await this._models.Project.findOne({
        where: { id: +index },
      });
      if (projectRow) {
        log.error(`Project ${index} already exists in db.`);
        return;
      }

      const ipfsHashId = await this._models.IpfsPins.findOne({
        where: { ipfs_hash: ipfsHash }
      });
      const ipfsParams = ipfsHashId ? { ipfs_hash_id: ipfsHashId.id } : {};

      // create new project (this should be the only place Projects are created)
      await this._models.Project.create({
        id: +index,
        entity_id: entityId,
        creator: event.data.creator,
        beneficiary: event.data.beneficiary,
        token: event.data.acceptedToken,
        curator_fee: event.data.curatorFee,
        threshold: event.data.threshold,
        deadline: event.data.deadline,
        funding_amount: event.data.fundingAmount,
        ...ipfsParams,
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
