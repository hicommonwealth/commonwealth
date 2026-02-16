import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import { useFetchProfileByIdQuery } from 'client/scripts/state/api/profiles';
import useGetERC20BalanceQuery from 'client/scripts/state/api/tokens/getERC20Balance';
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
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatAddressShort } from 'shared/utils';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import { useCommunityStake } from 'views/components/CommunityStake';
import { useTokenTradeWidget } from 'views/components/sidebar/CommunitySection/TokenTradeWidget/useTokenTradeWidget';
import './GovernanceUserProfile.scss';

const GovernanceUserProfile = () => {
  const userData = useUserStore();

  const { data } = useFetchProfileByIdQuery({
    apiCallEnabled: userData.isLoggedIn,
  });
  console.log('data => ', data);

  const { currentVoteWeight, stakeValue } = useCommunityStake({
    walletAddress: userData.activeAccount?.address || '',
  });

  // Community/node and token info to derive token address and RPC
  const { communityToken } = useTokenTradeWidget();
  const { data: community } = useGetCommunityByIdQuery({
    id: communityToken?.community_id || '',
    enabled: !!communityToken?.community_id,
    includeNodeInfo: true,
  });

  const tokenInfo = useMemo(() => {
    if (!communityToken) return { address: '', symbol: '' };
    // External pinned tokens use contract_address, launchpad tokens use token_address
    const address =
      (
        communityToken as unknown as {
          contract_address?: string;
          token_address?: string;
        }
      ).contract_address ||
      (communityToken as unknown as { token_address?: string }).token_address ||
      '';
    const symbol =
      (communityToken as unknown as { symbol?: string }).symbol || 'TOKEN';
    return { address, symbol };
  }, [communityToken]);

  const nodeRpc = community?.ChainNode?.url || '';

  const { data: tokenBalance = '0' } = useGetERC20BalanceQuery({
    userAddress: userData.activeAccount?.address || '',
    tokenAddress: tokenInfo.address,
    nodeRpc,
    enabled: Boolean(
      userData.activeAccount?.address && tokenInfo.address && nodeRpc,
    ),
  } as unknown as {
    userAddress: string;
    tokenAddress: string;
    nodeRpc: string;
    enabled?: boolean;
  });

  // CTA modal store for staking/locking
  const { setModeOfManageCommunityStakeModal } =
    useManageCommunityStakeModalStore();

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
        <div className="stats">
          <div className="stat">
            <CWText type="caption" className="stat-label">
              {tokenInfo.symbol} balance
            </CWText>
            <CWText fontWeight="semiBold" className="stat-value">
              {tokenBalance}
            </CWText>
          </div>
          <div className="stat">
            <CWText type="caption" className="stat-label">
              Voting power (veCommon)
            </CWText>
            <CWText fontWeight="semiBold" className="stat-value">
              {currentVoteWeight?.toString() || '0'}
            </CWText>
          </div>
          <div className="stat">
            <CWText type="caption" className="stat-label">
              Total stake value (USD)
            </CWText>
            <CWText fontWeight="semiBold" className="stat-value">
              {stakeValue ?? 0}
            </CWText>
          </div>
        </div>
        <div className="lock-cta">
          <CWButton
            label="Lock Tokens"
            buttonWidth="full"
            onClick={() => setModeOfManageCommunityStakeModal('buy')}
          />
          <CWText type="caption" className="lock-explainer">
            Locking your {tokenInfo.symbol} increases governance voting power
            via veCommon. Longer locks earn more voting weight.
          </CWText>
        </div>
      </div>

      <Link to={`/profile/id/${userData.id}`} className="user-info">
        <CWButton label="View Profile" buttonWidth="full" />
      </Link>
    </div>
  );
};

export default GovernanceUserProfile;
