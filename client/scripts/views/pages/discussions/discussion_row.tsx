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
  pluralize,
  offchainThreadStageToLabel,
} from 'helpers';
import {
  OffchainThread,
  OffchainThreadKind,
  OffchainThreadStage,
  AddressInfo,
} from 'models';
import { ReactionButton } from 'views/components/reaction_button';
import User from 'views/components/widgets/user';
import UserGallery from 'views/components/widgets/user_gallery';
import { DiscussionRowMenu } from './discussion_row_menu';
import { getLastUpdated, isHot } from './helpers';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

type DiscussionRowAttrs = {
  onSelect?: any;
  proposal: OffchainThread;
};

export class DiscussionRow implements m.ClassComponent<DiscussionRowAttrs> {
  view(vnode) {
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
          if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) return;
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
          <ReactionButton post={proposal} />
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
            {proposal.offchainVotingEnabled && (
              <Button
                label="Poll"
                contentRight={pluralize(
                  proposal.offchainVotingNumVotes,
                  'vote'
                )}
                intent="warning"
                size="xs"
                compact={true}
              />
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
            {proposal.stage !== OffchainThreadStage.Discussion && (
              <Button
                intent={
                  proposal.stage === OffchainThreadStage.ProposalInReview
                    ? 'positive'
                    : proposal.stage === OffchainThreadStage.Voting
                    ? 'positive'
                    : proposal.stage === OffchainThreadStage.Passed
                    ? 'positive'
                    : proposal.stage === OffchainThreadStage.Failed
                    ? 'negative'
                    : 'positive'
                }
                size="xs"
                compact={true}
                label={offchainThreadStageToLabel(proposal.stage)}
              />
            )}
            {proposal.kind === OffchainThreadKind.Link &&
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
