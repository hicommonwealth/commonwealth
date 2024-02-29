// Address can be shown in full, autotruncated with formatAddressShort(),
// or set to a custom max character length
import { PopperPlacementType } from '@mui/base/Popper';
import { UserProfile } from '../../../models/MinimumProfile';

export type AddressDisplayOptions = {
  autoTruncate?: boolean;
  maxCharLength?: number;
  showFullAddress?: boolean;
};

export type UserAttrs = {
  // addressDisplayOptions?: AddressDisplayOptions; // display full or truncated address
  // avatarOnly?: boolean; // overrides most other properties
  // avatarSize?: number;
  // hideAvatar?: boolean;
  // linkify?: boolean;
  // onClick?: (e: any) => void;
  // popover?: boolean;
  // showAddressWithDisplayName?: boolean; // show address inline with the display name
  // showAsDeleted?: boolean;
  // showRole?: boolean;
  // user: Account | AddressInfo | MinimumProfile | undefined;
  // role?: { permission: string };
  userAddress: string;
  userCommunityId: string;
  shouldShowAsDeleted?: boolean;
  shouldShowRole?: boolean;
  shouldHideAvatar?: boolean;
  shouldShowAvatarOnly?: boolean;
  shouldLinkProfile?: boolean;
  shouldShowPopover?: boolean;
  shouldShowAddressWithDisplayName?: boolean;
  avatarSize?: number;
  role?: { permission: string };
  popoverPlacement?: PopperPlacementType;
};

export type UserAttrsWithSkeletonProp = UserAttrs & {
  showSkeleton?: boolean;
};

export type FullUserAttrsWithSkeletonProp = UserAttrs & {
  profile: UserProfile;
  showSkeleton?: boolean;
};
