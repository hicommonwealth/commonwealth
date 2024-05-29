import { commonProtocol } from '@hicommonwealth/shared';
import { CWTooltip } from 'client/scripts/views/components/component_kit/new_designs/CWTooltip';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import { useCommunityStake } from 'views/components/CommunityStake';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './Stake.scss';

const Stake = () => {
  const navigate = useCommonNavigate();
  const { stakeEnabled } = useCommunityStake();
  const canEnableStake =
    !!commonProtocol?.factoryContracts[app?.chain?.meta?.ChainNode?.ethChainId];

  const actionButton = (
    <CWButton
      buttonType="secondary"
      label={stakeEnabled ? 'View stake information' : 'Enable stake'}
      disabled={!canEnableStake}
      onClick={() => navigate('/manage/integrations/stake')}
    />
  );

  return (
    <section className="Stake">
      <div className="header">
        <div className="flex-row">
          <CWText type="h4">Stake</CWText>
          {stakeEnabled && <CWIcon iconName="checkCircleFilled" />}
        </div>
        <CWText type="b1">
          Community stake allows your community to fundraise via member
          contributions. Community members can make financial contributions in
          exchange for more voting power within the community.
        </CWText>
      </div>

      {canEnableStake ? (
        actionButton
      ) : (
        <CWTooltip
          placement="right"
          content="Stake is not supported on your network"
          renderTrigger={(handleInteraction) => (
            <span
              className="w-fit"
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            >
              {actionButton}
            </span>
          )}
        />
      )}
    </section>
  );
};

export default Stake;
