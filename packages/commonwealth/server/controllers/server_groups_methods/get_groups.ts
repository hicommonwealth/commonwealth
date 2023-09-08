import { ServerChainsController } from '../server_chains_controller';
import { Requirement } from 'server/util/requirementsModule/requirementsTypes';

export type GetGroupsOptions = {
  withMembers?: boolean;
  address?: string;
};
// TODO: replace with GroupInstance after migration is complete
export type GetGroupsResult = {
  id: number;
  chain_id: string;
  metadata: any;
  requirements: Requirement[];
  members?: {
    group_id: number;
    address_id: number;
    allowed: boolean;
    last_checked: Date;
  }[];
}[];

export async function __getGroups(
  this: ServerChainsController,
  options: GetGroupsOptions
): Promise<GetGroupsResult> {
  /*
    TODO: Query groups from DB, optionally include allowed membership
  */
  return [
    {
      id: 1,
      chain_id: 'ethereum',
      metadata: {},
      requirements: [],
      members: !options.withMembers
        ? []
        : [
            {
              group_id: 1,
              address_id: 1,
              allowed: true,
              last_checked: new Date(),
            },
          ],
    },
  ];
}
