import { useFetchProfileByIdQuery } from 'client/scripts/state/api/profiles';
import useUserStore from 'client/scripts/state/ui/user';
import { saveToClipboard } from 'client/scripts/utils/clipboard';
import { CWIconButton } from 'client/scripts/views/components/component_kit/cw_icon_button';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { CWTooltip } from 'client/scripts/views/components/component_kit/new_designs/CWTooltip';
import {
  handleMouseEnter,
  handleMouseLeave,
} from 'client/scripts/views/menus/utils';
import React from 'react';
import { Link } from 'react-router-dom';
import { formatAddressShort } from 'shared/utils';
import { useCommunityStake } from 'views/components/CommunityStake';
import './GovernanceUserProfile.scss';

const GovernanceUserProfile = () => {
  const userData = useUserStore();

  const { data } = useFetchProfileByIdQuery({
    apiCallEnabled: userData.isLoggedIn,
  });

  const { currentVoteWeight, stakeValue } = useCommunityStake({
    walletAddress: userData.activeAccount?.address || '',
  });

  if (!data) return null;

  const avatar = data?.profile?.avatar_url ?? '';
  const address = userData.activeAccount?.address;

  return (
    <div className="GovernanceProfileCard">
      <div className="profile-header">
        <img src={avatar} alt={avatar} className="avatar" />
        <div className="profile-info">
          <CWTooltip
            content={
              data?.profile.name && data?.profile.name.length > 17
                ? data?.profile.name
                : null
            }
            placement="top"
            renderTrigger={(handleInteraction, isTooltipOpen) => (
              <Link
                onMouseEnter={(e) => {
                  handleMouseEnter({ e, isTooltipOpen, handleInteraction });
                }}
                onMouseLeave={(e) => {
                  handleMouseLeave({ e, isTooltipOpen, handleInteraction });
                }}
                to={`/profile/id/${userData.id}`}
                className="user-info"
              >
                <CWText fontWeight="medium">{data?.profile.name}</CWText>
              </Link>
            )}
          />
          <div className="profile-address">
            {address && (
              <>
                <CWText fontWeight="regular">
                  {formatAddressShort(address)}
                </CWText>
                <CWTooltip
                  placement="top"
                  content="address copied!"
                  renderTrigger={(handleInteraction, isTooltipOpen) => {
                    return (
                      <CWIconButton
                        iconName="copySimple"
                        onClick={(event) => {
                          saveToClipboard(address).catch(console.error);
                          handleInteraction(event);
                        }}
                        onMouseLeave={(e) => {
                          if (isTooltipOpen) {
                            handleInteraction(e);
                          }
                        }}
                        className="copy-icon"
                      />
                    );
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="profile-body">
        <CWText>Total stake: {stakeValue}</CWText>
        <CWText>
          Total voting power: {currentVoteWeight?.toString() || '0'}
        </CWText>
      </div>

      <Link to={`/profile/id/${userData.id}`} className="user-info">
        <CWButton label="View Profile" buttonWidth="full" />
      </Link>
    </div>
  );
};

export default GovernanceUserProfile;
