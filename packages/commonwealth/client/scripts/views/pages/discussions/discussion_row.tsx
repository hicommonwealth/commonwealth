/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import { Button, Tag } from 'construct-ui';

import 'pages/discussions/discussion_row.scss';

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
} from 'helpers';
import {
  Thread,
  ThreadKind,
  ThreadStage,
  AddressInfo,
} from 'models';
import User from 'views/components/widgets/user';
import UserGallery from 'views/components/widgets/user_gallery';
import { DiscussionRowMenu } from './discussion_row_menu';
import { getLastUpdated, isHot } from './helpers';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { DiscussionRowReactionButton } from '../../components/reaction_button/discussion_row_reaction_button';

type DiscussionRowAttrs = {
  onSelect?: any;
  proposal: Thread;
};

export class DiscussionRow implements m.ClassComponent<DiscussionRowAttrs> {
  view(vnode: m.VnodeDOM<DiscussionRowAttrs, this>) {
    const { proposal } = vnode.attrs;

    const discussionLink = getProposalUrlPath(
      proposal.slug,
      `${proposal.identifier}-${slugify(proposal.title)}`
    );
    return (
      <div
        class="DiscussionRow"
        onclick={(e) => {
          if (vnode.attrs.onSelect) {
            return vnode.attrs.onSelect();
          }
          if ($(e.target).hasClass('cui-tag')) return;
          if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) {
            window.open(discussionLink, '_blank');
            return;
          }
          e.preventDefault();
          const scrollEle = document.getElementsByClassName('Body')[0];
          localStorage[`${app.activeChainId()}-discussions-scrollY`] =
            scrollEle.scrollTop;
          m.route.set(discussionLink);
        }}
        key={proposal.id}
      >
        {proposal.pinned ? (
          <div class="pinned">
            <CWIcon iconName="pin" iconSize="small" />
          </div>
        ) : (
          <DiscussionRowReactionButton thread={proposal} />
        )}
        <div class="title-container">
          <div class="row-header">{proposal.title}</div>
          <div class="row-subheader">
            {proposal.readOnly && (
              <div class="discussion-locked">
                <Tag
                  size="xs"
                  label={<CWIcon iconName="lock" iconSize="small" />}
                />
              </div>
            )}
            {proposal.hasPoll && (
              <Button label="Poll" intent="warning" size="xs" compact={true} />
            )}
            {proposal.chainEntities?.length > 0 &&
              proposal.chainEntities
                .sort((a, b) => {
                  return +a.typeId - +b.typeId;
                })
                .map((ce) => {
                  if (!chainEntityTypeToProposalShortName(ce.type)) return;
                  return (
                    <Button
                      label={[
                        chainEntityTypeToProposalShortName(ce.type),
                        Number.isNaN(parseInt(ce.typeId, 10))
                          ? ''
                          : ` #${ce.typeId}`,
                      ]}
                      intent="primary"
                      class="proposal-button"
                      size="xs"
                      compact={true}
                    />
                  );
                })}
            {proposal.snapshotProposal && (
              <Button
                label={['Snap ', `${proposal.snapshotProposal.slice(0, 4)}…`]}
                intent="primary"
                class="proposal-button"
                size="xs"
                compact={true}
              />
            )}
            {proposal.stage !== ThreadStage.Discussion && (
              <Button
                intent={
                  proposal.stage === ThreadStage.ProposalInReview
                    ? 'positive'
                    : proposal.stage === ThreadStage.Voting
                    ? 'positive'
                    : proposal.stage === ThreadStage.Passed
                    ? 'positive'
                    : proposal.stage === ThreadStage.Failed
                    ? 'negative'
                    : 'positive'
                }
                size="xs"
                compact={true}
                label={threadStageToLabel(proposal.stage)}
              />
            )}
            {proposal.kind === ThreadKind.Link &&
              proposal.url &&
              externalLink(
                'a.external-discussion-link',
                proposal.url,
                `Link: ${extractDomain(proposal.url)}`
              )}
            {proposal.topic &&
              link(
                'a.proposal-topic',
                `/${app.activeChainId()}/discussions/${proposal.topic.name}`,
                <span class="proposal-topic-name">{proposal.topic.name}</span>
              )}
            {m(User, {
              user: new AddressInfo(
                null,
                proposal.author,
                proposal.authorChain,
                null
              ),
              linkify: true,
              popover: false,
              hideAvatar: true,
              showAddressWithDisplayName: true,
              hideIdentityIcon: true,
            })}
            {proposal.collaborators && proposal.collaborators.length > 0 && (
              <span class="proposal-collaborators">
                +{proposal.collaborators.length}
              </span>
            )}
            <div class="last-active created-at">
              {link(
                'a',
                discussionLink,
                `Last active ${formatLastUpdated(getLastUpdated(proposal))}`
              )}
            </div>
            {isHot(proposal) && (
              <div class="activity-icons">
                <span>🔥</span>
              </div>
            )}
          </div>
        </div>
        <div class="content-right-container">
          {m(UserGallery, {
            avatarSize: 36,
            popover: true,
            maxUsers: 2,
            addressesCount:
              app.threadUniqueAddressesCount.getAddressesCountRootId(
                `${proposal.slug}_${proposal.id}`
              ),
            users:
              app.threadUniqueAddressesCount.getUniqueAddressesByRootId(
                proposal
              ),
          })}
          {app.isLoggedIn() && <DiscussionRowMenu proposal={proposal} />}
        </div>
      </div>
    );
  }
}
