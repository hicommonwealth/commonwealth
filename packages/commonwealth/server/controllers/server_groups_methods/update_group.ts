import { ChainInstance } from 'server/models/chain';
import { ServerChainsController } from '../server_chains_controller';
import { AddressInstance } from 'server/models/address';
import { Requirement } from 'server/util/requirementsModule/requirementsTypes';
import { UserInstance } from 'server/models/user';

export type UpdateGroupOptions = {
  user: UserInstance;
  chain: ChainInstance;
  address: AddressInstance;
  metadata: any;
  requirements: Requirement[];
};
// TODO: replace with GroupInstance after migration is complete
export type UpdateGroupResult = {
  id: number;
  chain_id: string;
  metadata: any;
  requirements: Requirement[];
}[];

export async function __updateGroup(
  this: ServerChainsController,
  options: UpdateGroupOptions
): Promise<UpdateGroupResult> {
  // TODO: delete all existing memberships for group before update
  return [
    {
      id: 1,
      chain_id: 'ethereum',
      metadata: {},
      requirements: [],
    },
  ];
}
