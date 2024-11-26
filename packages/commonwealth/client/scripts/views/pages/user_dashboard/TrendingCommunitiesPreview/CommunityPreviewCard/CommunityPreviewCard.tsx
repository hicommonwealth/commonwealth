import { ChainBase } from '@hicommonwealth/shared';
import useUserStore from 'client/scripts/state/ui/user';
import Permissions from 'client/scripts/utils/Permissions';
import useJoinCommunity from 'client/scripts/views/components/SublayoutHeader/useJoinCommunity';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import clsx from 'clsx';
import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWCard } from '../../../../components/component_kit/cw_card';
import { CWCommunityAvatar } from '../../../../components/component_kit/cw_community_avatar';
import { CWText } from '../../../../components/component_kit/cw_text';
import './CommunityPreviewCard.scss';
type CommunityPreviewCardProps = {
  community?: {
    name: string;
    icon_url: string;
    id: string;
    base: ChainBase;
  };
  monthlyThreadCount?: number;
  isCommunityMember?: boolean;
  hasNewContent?: boolean;
  onClick?: () => any;
  isExploreMode?: boolean;
} & (
  | { isExploreMode: true }
  | {
      isExploreMode?: false;
      community: NonNullable<{
        name: string;
        icon_url: string;
        id: string;
        base: ChainBase;
      }>;
    }
);

const CommunityPreviewCard = ({
  community,
  monthlyThreadCount,
  isCommunityMember,
  hasNewContent,
  onClick,
  isExploreMode,
}: CommunityPreviewCardProps) => {
  const user = useUserStore();
  const userAddress = user.addresses?.[0];
  const isJoined = Permissions.isCommunityMember(community?.id);
  const { linkSpecificAddressToSpecificCommunity } = useJoinCommunity();

  const handleJoinButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    void (async () => {
      try {
        if (community) {
          await linkSpecificAddressToSpecificCommunity({
            address: userAddress?.address,
            community: {
              id: community.id,
              base: community.base,
              iconUrl: community.icon_url,
              name: community.name,
            },
          });
        }
      } catch (error) {
        console.error('Failed to join community:', error);
      }
    })();
  };

  return (
    <>
      <CWCard
        className={clsx('CommunityPreviewCard', { isExploreMode })}
        elevation="elevation-1"
        interactive
        onClick={(e) => {
          e.preventDefault();
          onClick?.();
        }}
      >
        {isExploreMode ? (
          <CWText type="h4" className="explore-label">
            Explore communities <CWIcon iconName="arrowRightPhosphor" />
          </CWText>
        ) : (
          <>
            <CWCommunityAvatar
              community={{
                name: community?.name || '',
                iconUrl: community?.icon_url || '',
              }}
              size="large"
            />
            <div className="community-name">
              {community?.name && (
                <CWText type="h4" fontWeight="medium">
                  {community?.name}
                </CWText>
              )}

              <div className="thread-counts">
                <CWIcon iconName="notepad" weight="light" />
                <CWText className="card-subtext" type="b2" fontWeight="medium">
                  {`${monthlyThreadCount || 0}/m`}
                </CWText>
                {isCommunityMember && hasNewContent && (
                  <CWTag type="new" label="New" />
                )}
              </div>
            </div>

            <div className="join-community">
              <CWButton
                containerClassName={clsx('join-btn', {
                  isJoined,
                })}
                buttonWidth="narrow"
                buttonHeight="sm"
                buttonType="tertiary"
                label={!isJoined ? 'Join Community' : 'Joined'}
                {...(isJoined && {
                  iconLeft: 'checkCircleFilled',
                  iconLeftWeight: 'fill',
                })}
                disabled={isJoined}
                onClick={handleJoinButtonClick}
              />
            </div>
          </>
        )}
      </CWCard>
    </>
  );
};

export { CommunityPreviewCard };
