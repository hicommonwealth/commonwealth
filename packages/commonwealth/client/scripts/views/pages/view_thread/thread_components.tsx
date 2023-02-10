import React from 'react';
import { ClassComponent } from 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';

import app from 'state';
import { navigateToSubpage } from 'router';
import {
  externalLink,
  extractDomain,
  pluralize,
  threadStageToLabel,
} from 'helpers';
import { ThreadStage as ThreadStageType, AddressInfo } from 'models';
import type { Account, Thread } from 'models';

import {
  Popover,
  usePopover,
} from '../../components/component_kit/cw_popover/cw_popover';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import { User } from '../../components/user/user';
import withRouter from 'navigation/helpers';

type ThreadComponentAttrs = {
  thread: Thread;
};

export const ThreadAuthor = (props: ThreadComponentAttrs) => {
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

class ExternalLinkComponent extends ClassComponent<ThreadComponentAttrs> {
  view(vnode: ResultNode<ThreadComponentAttrs>) {
    const { thread } = vnode.attrs;

    return (
      <div className="HeaderLink">
        {externalLink(
          'a',
          thread.url,
          [extractDomain(thread.url)],
          this.setRoute
        )}
        <CWIcon iconName="externalLink" iconSize="small" />
      </div>
    );
  }
}

export const ExternalLink = withRouter(ExternalLinkComponent);
