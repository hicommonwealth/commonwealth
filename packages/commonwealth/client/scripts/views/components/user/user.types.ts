import type Account from '../../../models/Account';
import AddressInfo from '../../../models/AddressInfo';
import MinimumProfile from '../../../models/MinimumProfile';

// Address can be shown in full, autotruncated with formatAddressShort(),
// or set to a custom max character length
export type AddressDisplayOptions = {
  autoTruncate?: boolean;
  maxCharLength?: number;
  showFullAddress?: boolean;
};

export type UserAttrs = {
  addressDisplayOptions?: AddressDisplayOptions; // display full or truncated address
  avatarOnly?: boolean; // overrides most other properties
  avatarSize?: number;
  hideAvatar?: boolean;
  linkify?: boolean;
  onClick?: (e: any) => void;
  popover?: boolean;
  showAddressWithDisplayName?: boolean; // show address inline with the display name
  showAsDeleted?: boolean;
  showRole?: boolean;
  user: Account | AddressInfo | MinimumProfile | undefined;
  role?: { permission: string };
};

export type UserAttrsWithSkeletonProp = UserAttrs & {
  showSkeleton?: boolean;
};
