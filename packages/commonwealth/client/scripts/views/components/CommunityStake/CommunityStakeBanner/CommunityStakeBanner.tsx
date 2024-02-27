import React from 'react';

import { useCommonNavigate } from 'navigation/helpers';

import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWText } from '../../component_kit/cw_text';
import CWBanner from '../../component_kit/new_designs/CWBanner';
import { CWTag } from '../../component_kit/new_designs/CWTag';

type CommunityStakeBannerProps = {
  onClose: () => void;
  groupName?: string;
};
export const CommunityStakeBanner = ({
  onClose,
  groupName,
}: CommunityStakeBannerProps) => {
  const navigate = useCommonNavigate();
  const { setModeOfManageCommunityStakeModal } =
    useManageCommunityStakeModalStore();

  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  const handleBuyStakeClick = async () => {
    if (!hasJoinedCommunity) {
      const joined = await handleJoinCommunity();

      if (joined) {
        setModeOfManageCommunityStakeModal('buy');
      }
    } else {
      setModeOfManageCommunityStakeModal('buy');
    }
  };

  return (
    <>
      <CWBanner
        className="CommunityStakeBanner"
        title="Increase your vote weight by buying community stake"
        body="The more stake you purchase, the greater your vote weight.
      This means you have greater influence over highlighting the ideas
       you think are most important while also supporting your community financially."
        buttons={[
          {
            label: 'Buy stake',
            buttonType: 'secondary',
            buttonAlt: 'green',
            buttonWidth: 'wide',
            onClick: handleBuyStakeClick,
          },
          {
            label: 'Learn More',
            buttonType: 'tertiary',
            onClick: () => {
              navigate('/');
            },
            iconRight: 'externalLink',
          },
        ]}
        onClose={onClose}
        footer={
          groupName ? (
            <>
              <CWText type="caption" className="description">
                Buying a stake will automatically place you in group
              </CWText>
              <CWTag label={groupName} type="group" />
            </>
          ) : null
        }
      />
      {JoinCommunityModals}
    </>
  );
};
