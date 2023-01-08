/* @jsx m */

import { navigateToSubpage } from 'app';
import ClassComponent from 'class_component';
import { externalLink, extractDomain, pluralize, threadStageToLabel, } from 'helpers';
import m from 'mithril';
import { Account, AddressInfo, Thread, ThreadStage as ThreadStageType, } from 'models';
import 'pages/view_proposal/proposal_header_links.scss';

import 'pages/view_thread/thread_components.scss';

import app from 'state';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWPopover } from '../../components/component_kit/cw_popover/cw_popover';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import User from '../../components/widgets/user';

type ThreadComponentAttrs = {
  thread: Thread;
};

export class ThreadAuthor extends ClassComponent<ThreadComponentAttrs> {
  view(vnode: m.Vnode<ThreadComponentAttrs>) {
    const { thread } = vnode.attrs;

    const author: Account = app.chain.accounts.get(thread.author);

    return (
      <div class="ThreadAuthor">
        {m(User, {
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
                <div class="collaborators">
                  {thread.collaborators.map(({ address, chain }) => {
                    return m(User, {
                      user: new AddressInfo(null, address, chain, null),
                    });
                  })}
                </div>
              }
              trigger={
                <CWText type="caption" className="trigger-text">
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
  view(vnode: m.Vnode<ThreadComponentAttrs>) {
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
        onclick={(e) => {
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
  view(vnode: m.Vnode<ThreadComponentAttrs>) {
    const { thread } = vnode.attrs;

    return (
      <div class="HeaderLink">
        {externalLink('a', thread.url, [extractDomain(thread.url)])}
        <CWIcon iconName="externalLink" iconSize="small" />
      </div>
    );
  }
}
