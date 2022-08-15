import Web3 from 'web3';
import BN from 'bn.js';
import { providers } from 'ethers';
import {
  IEventHandler,
  CWEvent,
  IChainEventData,
  CommonwealthTypes,
} from '@commonwealth/chain-events';
import { ChainInstance } from 'server/models/chain';
import { ICuratedProject__factory } from '../../shared/eth/types';
import { addPrefix, factory } from '../../shared/logging';
import { DB } from '../database';
import { ChainNodeAttributes } from '../models/chain_node';
export default class extends IEventHandler {
  public readonly name = 'Project';

  constructor(private readonly _models: DB) {
    super();
  }

  /**
   * Handles a project-related event by writing the corresponding update into
   * the database.
   */
  public async handle(event: CWEvent<IChainEventData>, dbEvent) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const log = factory.getLogger(
      addPrefix(__filename, [event.network, event.chain])
    );

    if (event.data.kind === CommonwealthTypes.EventKind.ProjectCreated) {
      // handle creation event by checking against projects table
      const entityId = dbEvent?.entity_id;
      if (!entityId) {
        log.error(`Entity not found on dbEvent: ${dbEvent.toString()}`);
        return; // oops, should not happen
      }
      const index = (event.data as any).index;
      const ipfsHash = (event.data as any).ipfsHash;

      const projectRow = await this._models.Project.findOne({
        where: { id: +index },
      });
      if (projectRow) {
        log.error(`Project ${index} already exists in db.`);
        return;
      }

      const ipfsHashId = await this._models.IpfsPins.findOne({
        where: { ipfs_hash: ipfsHash },
      });
      const ipfsParams = ipfsHashId ? { ipfs_hash_id: ipfsHashId.id } : {};

      // create new project (this should be the only place Projects are created)
      await this._models.Project.create({
        id: +index,
        entity_id: entityId,
        chain_id: (event.data as any).chainId,
        ...ipfsParams,
        creator: (event.data as any).creator,
        beneficiary: (event.data as any).beneficiary,
        token: (event.data as any).acceptedToken,
        curator_fee: (event.data as any).curatorFee,
        threshold: (event.data as any).threshold,
        deadline: (event.data as any).deadline,
        funding_amount: (event.data as any).fundingAmount,
        title: (event.data as any).title,
        short_description: (event.data as any).shortDescription,
        description: (event.data as any).description,
        cover_image: (event.data as any).coverImage,
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
        where: { entity_id: entityId },
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
