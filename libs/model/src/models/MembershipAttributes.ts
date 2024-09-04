import { AddressAttributes } from './AddressAttributes';
import { GroupAttributes } from './GroupAttributes';
import { MembershipRejectReason } from './MembershipRejectReason';

export type MembershipAttributes = {
  group_id: number;
  address_id: number;
  reject_reason?: MembershipRejectReason;
  last_checked: Date;

  // associations
  group?: GroupAttributes;
  address?: AddressAttributes;
};
