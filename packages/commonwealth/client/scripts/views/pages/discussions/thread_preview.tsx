/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import { Button, Tag } from 'construct-ui';

import 'pages/discussions/thread_preview.scss';

import { slugify } from 'utils';
import app from 'state';
import {
  chainEntityTypeToProposalShortName,
  getProposalUrlPath,
} from 'identifiers';
import {
  formatLastUpdated,
  link,
  externalLink,
  extractDomain,
  threadStageToLabel,
  isCommandClick,
} from 'helpers';
import { Thread, ThreadStage, AddressInfo, ThreadKind } from 'models';
import User from 'views/components/widgets/user';
import { ThreadPreviewMenu } from './thread_preview_menu';
import { getLastUpdated, isHot } from './helpers';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { ThreadPreviewReactionButton } from '../../components/reaction_button/thread_preview_reaction_button';

type ThreadPreviewAttrs = {
  thread: Thread;
};

export class ThreadPreview implements m.ClassComponent<ThreadPreviewAttrs> {
  view(vnode: m.VnodeDOM<ThreadPreviewAttrs, this>) {
    const { thread } = vnode.attrs;

    const discussionLink = getProposalUrlPath(
      thread.slug,
      `${thread.identifier}-${slugify(thread.title)}`
    );

    return (
      <div
        class="ThreadPreview"
        onclick={(e) => {
          if ($(e.target).hasClass('cui-tag')) return;

          if (isCommandClick(e)) {
            window.open(discussionLink, '_blank');
            return;
          }

          e.preventDefault();

          const scrollEle = document.getElementsByClassName('Body')[0];

          localStorage[`${app.activeChainId()}-discussions-scrollY`] =
            scrollEle.scrollTop;

          m.route.set(discussionLink);
        }}
        key={thread.id}
      >
        {thread.pinned ? (
          <div class="pinned">
            <CWIcon iconName="pin" iconSize="small" />
          </div>
        ) : (
          <ThreadPreviewReactionButton thread={thread} />
        )}
        <div class="title-container">
          <div class="row-header">{thread.title}</div>
          <div class="row-subheader">
            {thread.readOnly && (
              <div class="discussion-locked">
                {m(Tag, {
                  size: 'xs',
                  label: <CWIcon iconName="lock" iconSize="small" />,
                })}
              </div>
            )}
            {thread.hasPoll && (
              <Button label="Poll" intent="warning" size="xs" compact={true} />
            )}
            {thread.chainEntities?.length > 0 &&
              thread.chainEntities
                .sort((a, b) => {
                  return +a.typeId - +b.typeId;
                })
                .map((ce) => {
                  if (!chainEntityTypeToProposalShortName(ce.type)) return;
                  return m(Button, {
                    label: [
                      chainEntityTypeToProposalShortName(ce.type),
                      Number.isNaN(parseInt(ce.typeId, 10))
                        ? ''
                        : ` #${ce.typeId}`,
                    ],
                    intent: 'primary',
                    class: 'proposal-button',
                    size: 'xs',
                    compact: true,
                  });
                })}
            {thread.snapshotProposal && (
              <Button
                label={['Snap ', `${thread.snapshotProposal.slice(0, 4)}…`]}
                intent="primary"
                class="proposal-button"
                size="xs"
                compact={true}
              />
            )}
            {thread.stage !== ThreadStage.Discussion && (
              <Button
                intent={
                  thread.stage === ThreadStage.ProposalInReview
                    ? 'positive'
                    : thread.stage === ThreadStage.Voting
                    ? 'positive'
                    : thread.stage === ThreadStage.Passed
                    ? 'positive'
                    : thread.stage === ThreadStage.Failed
                    ? 'negative'
                    : 'positive'
                }
                size="xs"
                compact
                label={threadStageToLabel(thread.stage)}
              />
            )}
            {thread.kind === ThreadKind.Link &&
              thread.url &&
              externalLink(
                'a.external-discussion-link',
                thread.url,
                `Link: ${extractDomain(thread.url)}`
              )}
            {thread.topic &&
              link(
                'a.proposal-topic',
                `/${app.activeChainId()}/discussions/${thread.topic.name}`,
                <span class="proposal-topic-name">{thread.topic.name}</span>
              )}
            {m(User, {
              user: new AddressInfo(
                null,
                thread.author,
                thread.authorChain,
                null
              ),
              linkify: true,
              popover: false,
              hideAvatar: true,
              showAddressWithDisplayName: true,
              hideIdentityIcon: true,
            })}
            {thread.collaborators && thread.collaborators.length > 0 && (
              <span class="proposal-collaborators">
                +{thread.collaborators.length}
              </span>
            )}
            <div class="last-active created-at">
              {link(
                'a',
                discussionLink,
                `Last active ${formatLastUpdated(getLastUpdated(thread))}`
              )}
            </div>
            {isHot(thread) && (
              <div class="activity-icons">
                <span>🔥</span>
              </div>
            )}
          </div>
        </div>
        <div class="content-right-container">
          {app.isLoggedIn() && <ThreadPreviewMenu thread={thread} />}
        </div>
      </div>
    );
  }
}
