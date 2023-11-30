import 'components/component_kit/cw_community_avatar.scss';
import React from 'react';
import type ChainInfo from '../../../models/ChainInfo';
import { Skeleton } from '../Skeleton';
import type { IconSize } from './cw_icons/types';
import { CWText } from './cw_text';
import { getClasses } from './helpers';
import { ComponentType } from './types';

type CommunityAvatarProps = {
  community: ChainInfo;
  onClick?: () => void;
  size?: IconSize;
  showSkeleton?: boolean;
};

const CWCommunityAvatarSkeleton = () => {
  return (
    <div className={ComponentType.CommunityAvatar}>
      <Skeleton circle width={31} height={31} />
    </div>
  );
};

export const CWCommunityAvatar = (props: CommunityAvatarProps) => {
  const { community, onClick, size = 'large', showSkeleton } = props;

  if (showSkeleton) {
    return <CWCommunityAvatarSkeleton />;
  }

  const sizeIsAboveLarge =
    size !== 'small' && size !== 'medium' && size !== 'large';

  return (
    <div
      className={getClasses<{ onClick: boolean; size: IconSize }>(
        { onClick: !!onClick, size },
        ComponentType.CommunityAvatar,
      )}
      onClick={onClick}
    >
      {community?.iconUrl ? (
        <img className="community-image" src={community.iconUrl} />
      ) : (
        <div className={getClasses<{ size: IconSize }>({ size }, 'no-image')}>
          <CWText
            type={sizeIsAboveLarge ? 'h5' : 'caption'}
            className="avatar-no-image-letter"
            fontWeight="medium"
          >
            {community?.name?.slice(0, 1)}
          </CWText>
        </div>
      )}
    </div>
  );
};
