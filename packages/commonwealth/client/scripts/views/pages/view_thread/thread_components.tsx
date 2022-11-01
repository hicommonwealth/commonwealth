/* @jsx m */

import m from 'mithril';

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

export class ThreadAuthor
  implements
    m.Component<{
      thread: Thread;
    }>
{
  view(vnode) {
    const { thread } = vnode.attrs;

    const author: Account = app.chain.accounts.get(thread.author);

    return (
      <>
        {m(User, {
          avatarSize: 24,
          user: author,
          popover: true,
          linkify: true,
        })}
        {thread.collaborators?.length > 0 && (
          <>
            <CWText> and </CWText>
            <CWPopover
              interactionType="hover"
              hoverOpenDelay={500}
              content={thread.collaborators.map(({ address, chain }) => {
                return m(User, {
                  user: new AddressInfo(null, address, chain, null),
                  linkify: true,
                });
              })}
              trigger={
                <a href="#">
                  {pluralize(thread.collaborators?.length, 'other')}
                </a>
              }
            />
          </>
        )}
      </>
    );
  }
}

export class ThreadStage implements m.ClassComponent<{ proposal: Thread }> {
  view(vnode) {
    const { proposal } = vnode.attrs;

    return (
      <CWText
        type="caption"
        className={getClasses<{ stage: 'negative' | 'positive' }>(
          {
            stage:
              proposal.stage === ThreadStageType.ProposalInReview
                ? 'positive'
                : proposal.stage === ThreadStageType.Voting
                ? 'positive'
                : proposal.stage === ThreadStageType.Passed
                ? 'positive'
                : proposal.stage === ThreadStageType.Failed
                ? 'negative'
                : 'positive',
          },
          'proposal-stage-text'
        )}
        onclick={(e) => {
          e.preventDefault();
          navigateToSubpage(`?stage=${proposal.stage}`);
        }}
      >
        {threadStageToLabel(proposal.stage)}
      </CWText>
    );
  }
}

export class ExternalLink
  implements
    m.ClassComponent<{
      thread: Thread;
    }>
{
  view(vnode) {
    const { thread } = vnode.attrs;

    return (
      <div class="HeaderLink">
        {externalLink('a', thread.url, [extractDomain(thread.url)])}
        <CWIcon iconName="externalLink" iconSize="small" />
      </div>
    );
  }
}
