/* @jsx jsx */
import React from 'react';

import { navigateToSubpage } from 'router';
import {
  externalLink,
  extractDomain,
  pluralize,
  threadStageToLabel,
} from 'helpers';
import type { Account, Thread } from 'models';
import { AddressInfo, ThreadStage as ThreadStageType } from 'models';
import 'pages/view_proposal/proposal_header_links.scss';
import { ClassComponent, ResultNode, jsx } from 'mithrilInterop';
import 'pages/view_thread/thread_components.scss';

import app from 'state';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWPopover } from '../../components/component_kit/cw_popover/cw_popover';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import { User } from '../../components/user/user';

type ThreadComponentAttrs = {
  thread: Thread;
};

export class ThreadAuthor extends ClassComponent<ThreadComponentAttrs> {
  view(vnode: ResultNode<ThreadComponentAttrs>) {
    const { thread } = vnode.attrs;

    const author: Account = app.chain.accounts.get(thread.author);

    return (
      <div className="ThreadAuthor">
        <User avatarSize={24} user={author} popover linkify />
        {thread.collaborators?.length > 0 && (
          <React.Fragment>
            <CWText type="caption">and</CWText>
            <CWPopover
              interactionType="hover"
              hoverCloseDelay={500}
              content={
                <div className="collaborators">
                  {thread.collaborators.map(({ address, chain }) => {
                    return (
                      <User
                        user={new AddressInfo(null, address, chain, null)}
                      />
                    );
                  })}
                </div>
              }
              trigger={
                <CWText type="caption" className="trigger-text">
                  {pluralize(thread.collaborators?.length, 'other')}
                </CWText>
              }
            />
          </React.Fragment>
        )}
      </div>
    );
  }
}

export class ThreadStage extends ClassComponent<ThreadComponentAttrs> {
  view(vnode: ResultNode<ThreadComponentAttrs>) {
    const { thread } = vnode.attrs;

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
          navigateToSubpage(`?stage=${thread.stage}`);
        }}
      >
        {threadStageToLabel(thread.stage)}
      </CWText>
    );
  }
}

export class ExternalLink extends ClassComponent<ThreadComponentAttrs> {
  view(vnode: ResultNode<ThreadComponentAttrs>) {
    const { thread } = vnode.attrs;

    return (
      <div className="HeaderLink">
        {externalLink('a', thread.url, [extractDomain(thread.url)])}
        <CWIcon iconName="externalLink" iconSize="small" />
      </div>
    );
  }
}
