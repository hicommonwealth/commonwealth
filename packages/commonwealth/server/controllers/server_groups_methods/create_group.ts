import { CommunityInstance } from 'server/models/community';
import { ServerChainsController } from '../server_chains_controller';
import { AddressInstance } from '../../models/address';
import { Requirement } from '../../util/requirementsModule/requirementsTypes';
import { UserInstance } from '../../models/user';
import validateRequirements from '../../util/requirementsModule/validateRequirements';
import { AppError } from '../../../../common-common/src/errors';

const Errors = {
  InvalidRequirements: 'Invalid requirements',
};

export type CreateGroupOptions = {
  user: UserInstance;
  chain: CommunityInstance;
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
  { requirements }: CreateGroupOptions
): Promise<CreateGroupResult> {
  // TODO: require community admin
  const validationError = validateRequirements(requirements);
  if (validationError) {
    throw new AppError(validationError.message);
  }
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
