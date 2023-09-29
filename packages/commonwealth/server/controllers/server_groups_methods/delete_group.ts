import { ChainInstance } from 'server/models/chain';
import { ServerCommunitiesController } from '../server_communities_controller';
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
  this: ServerCommunitiesController,
  options: DeleteGroupOptions
): Promise<DeleteGroupResult> {
  // TODO: require community admin
  // TODO: delete all memberships for group along with group itself
}
