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
  className?: string;
};

export type UserAttrsWithSkeletonProp = UserAttrs & {
  showSkeleton?: boolean;
};

export type FullUserAttrsWithSkeletonProp = UserAttrs & {
  profile: UserProfile;
  showSkeleton?: boolean;
};
