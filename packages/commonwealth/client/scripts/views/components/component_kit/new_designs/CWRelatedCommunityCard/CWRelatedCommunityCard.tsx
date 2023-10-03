import React from 'react';
import type ChainInfo from 'client/scripts/models/ChainInfo';
import './CWRelatedCommunityCard.scss';
import { CWText } from '../../cw_text';
import { CWCommunityAvatar } from '../../cw_community_avatar';
import { ComponentType } from '../../types';
import { CWIcon } from '../../cw_icons/cw_icon';
import { pluralizeWithoutNumberPrefix } from '../../../../../helpers';
import { addPeriodToText } from './utils';

type CWRelatedCommunityCardProps = {
  chain: ChainInfo;
  memberCount: number;
  threadCount: number;
  actions: JSX.Element;
};

export const CWRelatedCommunityCard = (props: CWRelatedCommunityCardProps) => {
  const { chain, memberCount, threadCount, actions } = props;

  return (
    <div className={ComponentType.RelatedCommunityCard}>
      <div className="content-container">
        <div className="top-content">
          <div className="header">
            <CWCommunityAvatar community={chain} size="large" />
            <CWText type="h5" title={chain.name} fontWeight="medium">
              {chain.name}
            </CWText>
          </div>
          <div className="description">
            {chain.description ? addPeriodToText(chain.description) : null}
          </div>
        </div>
        <div className="metadata">
          <div className="member-data">
            <CWIcon iconName="users" iconSize="small" />
            <span className="count">{memberCount.toLocaleString('en-US')}</span>

            <span className="text">
              {pluralizeWithoutNumberPrefix(memberCount, 'member')}
            </span>
          </div>

          <div className="divider">
            <CWIcon iconName="dot" />
          </div>

          <div className="thread-data">
            <CWIcon iconName="notepad" />
            <span className="count">{threadCount.toLocaleString('en-US')}</span>
            <span className="text">
              {pluralizeWithoutNumberPrefix(threadCount, 'thread')}
            </span>
          </div>
        </div>

        {actions && <div className="actions">{actions}</div>}
      </div>
    </div>
  );
};
