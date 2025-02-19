import { ChainBase } from '@hicommonwealth/shared';
import app from 'client/scripts/state';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import { saveToClipboard } from 'client/scripts/utils/clipboard';
import { CWIconButton } from 'client/scripts/views/components/component_kit/cw_icon_button';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWIdentificationTag } from 'client/scripts/views/components/component_kit/new_designs/CWIdentificationTag';
import { CWTag } from 'client/scripts/views/components/component_kit/new_designs/CWTag';
import { CWTooltip } from 'client/scripts/views/components/component_kit/new_designs/CWTooltip';
import { LaunchpadToken } from 'client/scripts/views/modals/TradeTokenModel/CommonTradeModal/types';
import { ExternalToken } from 'client/scripts/views/modals/TradeTokenModel/UniswapTradeModal/types';
import React from 'react';
import { formatAddressShort } from 'shared/utils';
import { useTokenTradeWidget } from 'views/components/sidebar/CommunitySection/TokenTradeWidget/useTokenTradeWidget';
import './GovernanceHeader.scss';

const GovernanceHeader = () => {
  const communityId = app.activeChainId() || '';

  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  const { communityToken, isPinnedToken } = useTokenTradeWidget();

  const address = communityToken
    ? isPinnedToken
      ? (communityToken as ExternalToken).contract_address
      : (communityToken as LaunchpadToken).token_address
    : null;

  const snapShotAvailable =
    app.chain?.base === ChainBase.Ethereum &&
    !!community?.snapshot_spaces?.length;

  return (
    <div className="GovernancePage">
      <div className="header">
        <CWText type="h3" fontWeight="semiBold">
          {community?.name} Governance
        </CWText>
        {snapShotAvailable && <CWTag label="Snapshot" type="proposal" />}
        {address && (
          <div className="address-details">
            <div className="address">
              <CWIcon iconName="ethereum" iconSize="small" />
              <CWIdentificationTag address={formatAddressShort(address)} />
            </div>
            <CWTooltip
              placement="top"
              content="address copied!"
              renderTrigger={(handleInteraction, isTooltipOpen) => (
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
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GovernanceHeader;
