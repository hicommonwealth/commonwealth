import clsx from 'clsx';
import React from 'react';
import { Skeleton } from '../Skeleton';
import './cw_community_avatar.scss';
import type { IconSize } from './cw_icons/types';
import { CWText } from './cw_text';
import { getClasses } from './helpers';
import { ComponentType } from './types';

type CommunityAvatarProps = {
  community: {
    id?: string;
    name: string;
    iconUrl: string;
  };
  onClick?: () => void;
  size?: IconSize;
  showSkeleton?: boolean;
  selectedCommunity?: string;
};

const CWCommunityAvatarSkeleton = () => {
  return (
    <div className={ComponentType.CommunityAvatar}>
      <Skeleton circle width={31} height={31} />
    </div>
  );
};

// eslint-disable-next-line react/no-multi-comp
export const CWCommunityAvatar = (props: CommunityAvatarProps) => {
  const {
    community,
    onClick,
    size = 'large',
    showSkeleton,
    selectedCommunity,
  } = props;

  if (showSkeleton) {
    return <CWCommunityAvatarSkeleton />;
  }

  const sizeIsAboveLarge =
    size !== 'small' && size !== 'medium' && size !== 'large';

  const isSelected = selectedCommunity === community.id;
  return (
    <div
      className={getClasses<{
        onClick: boolean;
        size: IconSize;
        isSelected: boolean;
      }>(
        { onClick: !!onClick, size, isSelected },
        ComponentType.CommunityAvatar,
      )}
      onClick={onClick}
    >
      {community?.iconUrl ? (
        <img
          className={clsx('community-image', { isSelected: isSelected })}
          src={community.iconUrl}
        />
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
