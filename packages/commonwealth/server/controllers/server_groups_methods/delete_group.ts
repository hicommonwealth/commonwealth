import { CommunityInstance } from '../../models/community';
import { ServerChainsController } from '../server_chains_controller';
import { AddressInstance } from '../../models/address';
import { UserInstance } from '../../models/user';

export type DeleteGroupOptions = {
  user: UserInstance;
  chain: CommunityInstance;
  address: AddressInstance;
  groupId: number;
};

export type DeleteGroupResult = void;

export async function __deleteGroup(
  this: ServerChainsController,
  options: DeleteGroupOptions
): Promise<DeleteGroupResult> {
  // TODO: require community admin
  // TODO: delete all memberships for group along with group itself
}
