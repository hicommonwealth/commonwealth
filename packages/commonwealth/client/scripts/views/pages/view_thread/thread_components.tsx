/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'pages/view_thread/thread_components.scss';
import 'pages/view_proposal/proposal_header_links.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import {
  externalLink,
  extractDomain,
  pluralize,
  threadStageToLabel,
} from 'helpers';
import {
  Account,
  Thread,
  ThreadStage as ThreadStageType,
  AddressInfo,
} from 'models';
import User from '../../components/widgets/user';
import { CWText } from '../../components/component_kit/cw_text';
import { CWPopover } from '../../components/component_kit/cw_popover/cw_popover';
import { getClasses } from '../../components/component_kit/helpers';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

type ThreadComponentAttrs = {
  thread: Thread;
};

export class ThreadAuthor extends ClassComponent<ThreadComponentAttrs> {
  view(vnode: ResultNode<ThreadComponentAttrs>) {
    const { thread } = vnode.attrs;

    const author: Account = app.chain.accounts.get(thread.author);

    return (
      <div className="ThreadAuthor">
        {render(User, {
          avatarSize: 24,
          user: author,
          popover: true,
          linkify: true,
        })}
        {thread.collaborators?.length > 0 && (
          <>
            <CWText type="caption">and</CWText>
            <CWPopover
              interactionType="hover"
              hoverCloseDelay={500}
              content={
                <div className="collaborators">
                  {thread.collaborators.map(({ address, chain }) => {
                    return render(User, {
                      user: new AddressInfo(null, address, chain, null),
                    });
                  })}
                </div>
              }
              trigger={
                <CWText type="caption" class="trigger-text">
                  {pluralize(thread.collaborators?.length, 'other')}
                </CWText>
              }
            />
          </>
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
        class={getClasses<{ stage: 'negative' | 'positive' }>(
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
