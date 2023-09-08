import { ChainInstance } from 'server/models/chain';
import { ServerChainsController } from '../server_chains_controller';
import { AddressInstance } from '../../models/address';
import { UserInstance } from '../../models/user';

export type DeleteGroupOptions = {
  user: UserInstance;
  chain: ChainInstance;
  address: AddressInstance;
  groupId: number;
};

export type DeleteGroupResult = void;

export async function __deleteGroup(
  this: ServerChainsController,
  options: DeleteGroupOptions
): Promise<DeleteGroupResult> {
  // TODO: delete all memberships for group along with group itself
}
