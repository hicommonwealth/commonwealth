import { ChainInstance } from 'server/models/chain';
import { ServerChainsController } from '../server_chains_controller';
import { AddressInstance } from '../../models/address';
import { Requirement } from '../../util/requirementsModule/requirementsTypes';
import { UserInstance } from '../../models/user';

export type CreateGroupOptions = {
  user: UserInstance;
  chain: ChainInstance;
  address: AddressInstance;
  metadata: any;
  requirements: Requirement[];
  topics: number[];
};
// TODO: replace with GroupInstance after migration is complete
export type CreateGroupResult = {
  id: number;
  chain_id: string;
  metadata: any;
  requirements: Requirement[];
}[];

export async function __createGroup(
  this: ServerChainsController,
  options: CreateGroupOptions
): Promise<CreateGroupResult> {
  /*
    TODO:
      - validate schema
      - restrict to 20 groups per chain
      - save group
      - optionally add group to each specified topics
  */
  return [
    {
      id: 1,
      chain_id: 'ethereum',
      metadata: {},
      requirements: [],
    },
  ];
}
