import { getRandomAvatar } from '@hicommonwealth/shared';
import React from 'react';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { Skeleton } from 'views/components/Skeleton';
import CommunityInfo from 'views/components/component_kit/CommunityInfo';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import './ExploreCard.scss';

type ExploreCardProps = {
  label: string;
  description: string;
  xpPoints: number;
  communityId?: string;
  onExploreClick: () => void;
} & (
  | {
      featuredImgURL: string;
      featuredIconName?: never;
    }
  | {
      featuredImgURL?: never;
      featuredIconName: 'telegram';
    }
);

const ExploreCard = ({
  label,
  description,
  xpPoints,
  featuredIconName,
  communityId,
  featuredImgURL,
  onExploreClick,
}: ExploreCardProps) => {
  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: communityId || '',
      enabled: !!communityId,
    });

  return (
    <section className="ExploreCard">
      {communityId ? (
        <>
          {isLoadingCommunity || !community ? (
            <Skeleton />
          ) : (
            <CommunityInfo
              name={community.name}
              communityId={community.id}
              iconUrl={community.icon_url || ''}
            />
          )}
        </>
      ) : (
        <CommunityInfo
          name="Global Quest"
          communityId="global"
          iconUrl={getRandomAvatar()}
          linkToCommunity={false}
        />
      )}
      <CWDivider />
      <div className="grid">
        <div className="left">
          <CWText className="label" type="h5">
            {label}
          </CWText>
          <CWText className="description mt-16" type="b2">
            {description}
          </CWText>
          <div className="row">
            <CWTag
              label={`${xpPoints} XP`}
              type="proposal"
              classNames="xp-points"
            />
            <CWButton
              label="Details"
              buttonType="tertiary"
              buttonWidth="narrow"
              buttonHeight="med"
              iconRight="arrowRight"
              type="button"
              onClick={onExploreClick}
            />
          </div>
        </div>
        <div className="right">
          {featuredIconName && (
            <CWIcon
              iconSize="xl"
              iconName={featuredIconName}
              className="featured-icon"
            />
          )}
          {featuredImgURL && (
            <img
              src={featuredImgURL}
              alt="featured-img"
              className="featured-img"
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default ExploreCard;
