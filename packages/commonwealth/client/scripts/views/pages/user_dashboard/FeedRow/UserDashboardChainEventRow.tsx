import React from 'react';

import ChainInfo from '../../../../models/ChainInfo';

import app from 'state';

import './UserDashboardChainEventRow.scss';
import type { IEventLabel } from '../../../../../../../chain-events/src';
import { CWCommunityAvatar } from '../../../components/component_kit/cw_community_avatar';
import { CWIcon } from '../../../components/component_kit/cw_icons/cw_icon';
import type { IconName } from '../../../components/component_kit/cw_icons/cw_icon_lookup';
import { CWText } from '../../../components/component_kit/cw_text';
import { getClasses } from '../../../components/component_kit/helpers';
import { useCommonNavigate } from 'navigation/helpers';

type UserDashboardChainEventRowProps = {
  blockNumber: number;
  chain: ChainInfo;
  label: IEventLabel;
};

export const UserDashboardChainEventRow = (
  props: UserDashboardChainEventRowProps
) => {
  const { blockNumber, chain, label } = props;
  const navigate = useCommonNavigate();

  const handleLinkClick = () => {
    if (label.linkUrl) {
      const activeChainId = app.activeChainId();
      const shouldUpdateLinkUrl =
        activeChainId && label.linkUrl.startsWith(`/${activeChainId}`);

      const updatedLinkUrl = shouldUpdateLinkUrl
        ? label.linkUrl.replace(`/${activeChainId}`, '')
        : label.linkUrl;

      // Extract chain_id from the link URL
      const linkUrlParts = label.linkUrl.split('/');

      navigate(updatedLinkUrl);
    }
  };

  const handleCommunityClick = (e) => {
    e.stopPropagation();
    if (chain?.id) navigate(`/${chain?.id}`, {}, null);
  };

  return (
    <div
      className={getClasses<{ isLink?: boolean }>(
        { isLink: !!label.linkUrl },
        'UserDashboardChainEventRow'
      )}
      onClick={handleLinkClick}
    >
      <div className="chain-event-icon-container">
        <CWIcon
          iconName={label.icon ? (label.icon as IconName) : 'element'}
          className={label.icon === 'delegate' ? 'delegate' : ''}
        />
      </div>
      <div className="chain-event-text-container">
        <div className="community-title">
          <CWCommunityAvatar community={chain} size="small" />
          <span onClick={handleCommunityClick} style={{ cursor: 'pointer' }}>
            <CWText type="caption" fontWeight="medium">
              {chain?.name || 'Unknown chain'}
            </CWText>
          </span>
          <div className="dot">.</div>
          <CWText type="caption" fontWeight="medium" className="block">
            Block {blockNumber}
          </CWText>
        </div>
        <CWText className="row-top-text" fontWeight="bold">
          {label.heading}
        </CWText>
        <CWText type="caption" className="label">
          {label.label}
        </CWText>
      </div>
    </div>
  );
};
