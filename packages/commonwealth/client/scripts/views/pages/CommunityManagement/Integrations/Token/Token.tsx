import { ChainBase } from '@hicommonwealth/shared';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import './Token.scss';

const Token = () => {
  const navigate = useCommonNavigate();

  const isExternalTokenLinked = false; // TODO: this needs to come from API
  const canAddToken = app?.chain?.base === ChainBase.Ethereum; // only ethereum communities can add a token

  const actionButton = (
    <CWButton
      buttonType="secondary"
      label={isExternalTokenLinked ? 'Manage connected tokens' : 'Add token'}
      disabled={!canAddToken}
      onClick={() => navigate('/manage/integrations/token')}
    />
  );

  return (
    <section className="Stake">
      <div className="header">
        <div className="flex-row">
          <CWText type="h4">Connect an existing token</CWText>
          {isExternalTokenLinked && <CWIcon iconName="checkCircleFilled" />}
        </div>
        <CWText type="b1">
          Connect any existing token that is active on Uniswap to your
          community.
        </CWText>
      </div>

      {canAddToken ? (
        actionButton
      ) : (
        <CWTooltip
          placement="right"
          content="Connecting a token isn't supported in your community network"
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

export default Token;
