import { externalLink, extractDomain, pluralize, threadStageToLabel, } from 'helpers';
import { useCommonNavigate } from 'navigation/helpers';

import 'pages/view_proposal/proposal_header_links.scss';
import React from 'react';

import app from 'state';
import type Account from '../../../models/Account';
import AddressInfo from '../../../models/AddressInfo';
import type Thread from '../../../models/Thread';
import { ThreadStageType } from '../../../models/types';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

import { Popover, usePopover, } from '../../components/component_kit/cw_popover/cw_popover';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import { User } from '../../components/user/user';

type ThreadComponentProps = {
  thread: Thread;
};

export const ThreadAuthor = (props: ThreadComponentProps) => {
  const { thread } = props;

  const popoverProps = usePopover();

  const author: Account = app.chain.accounts.get(thread.author);

  return (
    <div className="ThreadAuthor">
      <User avatarSize={24} user={author} popover linkify />
      {thread.collaborators?.length > 0 && (
        <>
          <CWText type="caption">and</CWText>
          <Popover
            content={
              <div className="collaborators">
                {thread.collaborators.map(({ address, chain }) => {
                  return (
                    <User user={new AddressInfo(null, address, chain, null)} />
                  );
                })}
              </div>
            }
            {...popoverProps}
          />
          <CWText
            type="caption"
            className="trigger-text"
            onMouseEnter={popoverProps.handleInteraction}
            onMouseLeave={popoverProps.handleInteraction}
          >
            {pluralize(thread.collaborators?.length, 'other')}
          </CWText>
        </>
      )}
    </div>
  );
};

export const ThreadStage = (props: ThreadComponentProps) => {
  const { thread } = props;
  const navigate = useCommonNavigate();

  return (
    <CWText
      type="caption"
      className={getClasses<{ stage: 'negative' | 'positive' }>(
        {
          stage:
            thread.stage === ThreadStageType.ProposalInReview
              ? 'positive'
              : thread.stage === ThreadStageType.Voting
              ? 'positive'
              : thread.stage === ThreadStageType.Passed
              ? 'positive'
              : thread.stage === ThreadStageType.Failed
              ? 'negative'
              : 'positive',
        },
        'proposal-stage-text'
      )}
      onClick={(e) => {
        e.preventDefault();
        navigate(`/discussions?stage=${thread.stage}`);
      }}
    >
      {threadStageToLabel(thread.stage)}
    </CWText>
  );
};

export const ExternalLink = (props: ThreadComponentProps) => {
  const { thread } = props;

  const navigate = useCommonNavigate();

  return (
    <div className="HeaderLink">
      {externalLink('a', thread.url, [extractDomain(thread.url)], navigate)}
      <CWIcon iconName="externalLink" iconSize="small" />
    </div>
  );
};
