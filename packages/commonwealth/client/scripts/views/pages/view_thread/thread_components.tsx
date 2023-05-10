import React from 'react';

import 'pages/view_proposal/proposal_header_links.scss';
import 'pages/view_thread/thread_components.scss';

import app from 'state';
import { externalLink, extractDomain, pluralize, threadStageToLabel } from '../../../helpers/index';
import type Account from '../../../models/Account';
import AddressInfo from '../../../models/AddressInfo';
import type Thread from '../../../models/Thread';
import { ThreadStage } from '../../../models/types';
import {
  Popover,
  usePopover,
} from '../../components/component_kit/cw_popover/cw_popover';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import { User } from '../../components/user/user';
import { useCommonNavigate } from 'navigation/helpers';

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
          <CWText
            type="caption"
            className="trigger-text"
            onMouseEnter={popoverProps.handleInteraction}
            onMouseLeave={popoverProps.handleInteraction}
          >
            {pluralize(thread.collaborators?.length, 'other')}
            <Popover
              content={
                <div className="collaborators">
                  {thread.collaborators.map(({ address, chain }) => {
                    return (
                      <User
                        linkify
                        key={address}
                        user={new AddressInfo(null, address, chain, null)}
                      />
                    );
                  })}
                </div>
              }
              {...popoverProps}
            />
          </CWText>
        </>
      )}
    </div>
  );
};

export const ThreadStageComponent = (props: ThreadComponentProps) => {
  const { thread } = props;
  const navigate = useCommonNavigate();

  return (
    <CWText
      type="caption"
      className={getClasses<{ stage: 'negative' | 'positive' }>(
        {
          stage:
            thread.stage === ThreadStage.ProposalInReview
              ? 'positive'
              : thread.stage === ThreadStage.Voting
              ? 'positive'
              : thread.stage === ThreadStage.Passed
              ? 'positive'
              : thread.stage === ThreadStage.Failed
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
