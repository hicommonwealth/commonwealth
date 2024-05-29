import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';

const TooltipsShowcase = () => {
  const content =
    'Commonwealth is an all-in-one platform for ' +
    'on-chain communities to discuss, vote, and fund' +
    'projects together. Never miss an on-chain event, proposal, or important discussion again.';

  return (
    <>
      <CWTooltip
        content={content}
        placement="top"
        renderTrigger={(handleInteraction) => (
          <CWText
            onMouseEnter={handleInteraction}
            onMouseLeave={handleInteraction}
          >
            Tooltip over text
          </CWText>
        )}
      />

      <CWText type="h5">Icon</CWText>
      <CWTooltip
        content={content}
        placement="top"
        renderTrigger={(handleInteraction) => (
          <CWIcon
            iconName="infoEmpty"
            onMouseEnter={handleInteraction}
            onMouseLeave={handleInteraction}
          />
        )}
      />

      <CWText type="h5">Placement</CWText>
      <div className="flex-row">
        <CWTooltip
          content={content}
          placement="top"
          renderTrigger={(handleInteraction) => (
            <CWButton
              buttonHeight="sm"
              label="top"
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            />
          )}
        />
        <CWTooltip
          content={content}
          placement="right"
          renderTrigger={(handleInteraction) => (
            <CWButton
              buttonHeight="sm"
              label="right"
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            />
          )}
        />
        <CWTooltip
          content={content}
          placement="bottom"
          renderTrigger={(handleInteraction) => (
            <CWButton
              buttonHeight="sm"
              label="bottom"
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            />
          )}
        />
        <CWTooltip
          content={content}
          placement="left"
          renderTrigger={(handleInteraction) => (
            <CWButton
              buttonHeight="sm"
              label="left"
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            />
          )}
        />
      </div>
    </>
  );
};

export default TooltipsShowcase;
