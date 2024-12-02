import { ChainBase } from '@hicommonwealth/shared';
import useDeferredConditionTriggerCallback from 'client/scripts/hooks/useDeferredConditionTriggerCallback';
import useUserStore from 'client/scripts/state/ui/user';
import Permissions from 'client/scripts/utils/Permissions';
import useJoinCommunity from 'client/scripts/views/components/SublayoutHeader/useJoinCommunity';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { AuthModal } from 'client/scripts/views/modals/AuthModal';
import clsx from 'clsx';
import React from 'react';
import { smartTrim } from 'shared/utils';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWCard } from '../../../../components/component_kit/cw_card';
import { CWCommunityAvatar } from '../../../../components/component_kit/cw_community_avatar';
import { CWText } from '../../../../components/component_kit/cw_text';
import './CommunityPreviewCard.scss';
type CommunityPreviewCardProps = {
  monthlyThreadCount?: number;
  isCommunityMember?: boolean;
  hasNewContent?: boolean;
  onClick?: () => any;
} & (
  | {
      isExploreMode: true;
      community?: never;
    }
  | {
      isExploreMode?: never;
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
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const userAddress = user.addresses?.[0];
  const isJoined = Permissions.isCommunityMember(community?.id);
  const { linkSpecificAddressToSpecificCommunity } = useJoinCommunity();

  const { register, trigger } = useDeferredConditionTriggerCallback({
    shouldRunTrigger: user.isLoggedIn,
  });

  const openAuthModalOrTriggerCallback = () => {
    if (user.isLoggedIn) {
      trigger();
    } else {
      setIsAuthModalOpen(!user.isLoggedIn);
    }
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
                  {smartTrim(community?.name, 10)}
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  register({
                    cb: (communityData: typeof community) => {
                      if (communityData && userAddress?.address) {
                        linkSpecificAddressToSpecificCommunity({
                          address: userAddress.address,
                          community: {
                            id: communityData.id,
                            base: communityData.base,
                            iconUrl: communityData.icon_url,
                            name: communityData.name,
                          },
                        }).catch(console.error);
                      }
                    },
                    args: community,
                  });
                  openAuthModalOrTriggerCallback();
                }}
              />
            </div>
          </>
        )}
      </CWCard>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
        }}
        showWalletsFor={ChainBase.Ethereum}
      />
    </>
  );
};

export { CommunityPreviewCard };
