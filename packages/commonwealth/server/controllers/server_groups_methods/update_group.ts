import { ChainInstance } from '../../models/community';
import { ServerChainsController } from '../server_chains_controller';
import { AddressInstance } from '../../models/address';
import { Requirement } from '../../util/requirementsModule/requirementsTypes';
import { UserInstance } from '../../models/user';
import validateRequirements from '../../util/requirementsModule/validateRequirements';
import { AppError } from '../../../../common-common/src/errors';

const Errors = {
  InvalidRequirements: 'Invalid requirements',
};

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
  { requirements }: UpdateGroupOptions
): Promise<UpdateGroupResult> {
  // TODO: require community admin
  const validationError = validateRequirements(requirements);
  if (validationError) {
    throw new AppError(validationError.message);
  }
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
