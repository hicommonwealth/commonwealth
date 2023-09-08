import { ChainInstance } from 'server/models/chain';
import { ServerChainsController } from '../server_chains_controller';
import { AddressInstance } from '../../models/address';
import { UserInstance } from '../../models/user';

export type RefreshMembershipOptions = {
  user: UserInstance;
  chain: ChainInstance;
  address: AddressInstance;
  topicId: number;
};
export type RefreshMembershipResult = {
  topicId: number;
  allowed: boolean;
  rejectReason?: string;
};

export async function __refreshMembership(
  this: ServerChainsController,
  options: RefreshMembershipOptions
): Promise<RefreshMembershipResult> {
  /*
    TODO: Check membership status of address for groups on specified topic
      - if membership missing or stale => recompute, save and return membership
      - else if membership fresh => return membership

      Membership model:
      {
        group_id: number
        address_id: number
        allowed: boolean
        reject_reason?: string
        last_checked: Date
      }
  */
  return {
    topicId: 1,
    allowed: true,
  };
}
