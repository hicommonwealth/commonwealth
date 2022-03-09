/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import { Button, Icon, Icons, Tag } from 'construct-ui';

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
import { ReactionButton, ReactionType } from 'views/components/reaction_button';
import User from 'views/components/widgets/user';
import UserGallery from 'views/components/widgets/user_gallery';
import { ListingRow } from 'views/components/listing_row';
import DiscussionRowMenu from './discussion_row_menu';
import { getLastUpdated, isHot } from './helpers';

type DiscussionRowAttrs = {
  onSelect?: any;
  proposal: OffchainThread;
};

export class DiscussionRow implements m.ClassComponent<DiscussionRowAttrs> {
  view(vnode) {
    const { proposal } = vnode.attrs;

    if (!proposal) return;

    const propType: OffchainThreadKind = proposal.kind;

    const pinned = proposal.pinned;

    const discussionLink = getProposalUrlPath(
      proposal.slug,
      `${proposal.identifier}-${slugify(proposal.title)}`
    );

    const rowHeader = link('a', discussionLink, proposal.title);

    const rowSubheader = [
      proposal.readOnly && (
        <div class="discussion-locked">
          <Tag size="xs" label={<Icon name={Icons.LOCK} size="xs" />} />
        </div>
      ),
      proposal instanceof OffchainThread && proposal.offchainVotingEnabled && (
        <Button
          class="discussion-row-linked-poll"
          label="Poll"
          contentRight={pluralize(proposal.offchainVotingNumVotes, 'vote')}
          intent="warning"
          size="xs"
          compact={true}
        />
      ),
      proposal.chainEntities?.length > 0 &&
        proposal.chainEntities
          .sort((a, b) => {
            return +a.typeId - +b.typeId;
          })
          .map((ce) => {
            if (!chainEntityTypeToProposalShortName(ce.type)) return;
            return (
              <Button
                class="discussion-row-linked-chain-entity"
                label={[
                  chainEntityTypeToProposalShortName(ce.type),
                  Number.isNaN(parseInt(ce.typeId, 10)) ? '' : ` #${ce.typeId}`,
                ]}
                intent="primary"
                size="xs"
                compact={true}
              />
            );
          }),
      proposal.snapshotProposal && (
        <Button
          class="discussion-row-linked-chain-entity"
          label={['Snap ', `${proposal.snapshotProposal.slice(0, 4)}…`]}
          intent="primary"
          size="xs"
          compact={true}
        />
      ),
      proposal instanceof OffchainThread &&
        proposal.stage !== OffchainThreadStage.Discussion && (
          <Button
            class="discussion-row-stage-btn"
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
        ),
      propType === OffchainThreadKind.Link &&
        proposal.url &&
        externalLink(
          'a.external-discussion-link',
          proposal.url,
          `Link: ${extractDomain(proposal.url)}`
        ),
      proposal.topic &&
        link(
          'a.proposal-topic',
          `/${app.activeChainId()}/discussions/${proposal.topic.name}`,
          <span class="proposal-topic-name">{proposal.topic.name}</span>
        ),
      m(User, {
        user: new AddressInfo(
          null,
          proposal.author,
          proposal.authorChain,
          null
        ),
        linkify: true,
        popover: true,
        hideAvatar: true,
        showAddressWithDisplayName: true,
        hideIdentityIcon: true,
      }),
      proposal instanceof OffchainThread &&
        proposal.collaborators &&
        proposal.collaborators.length > 0 && (
          <span class="proposal-collaborators">
            +{proposal.collaborators.length}
          </span>
        ),
      <div class="last-active created-at">
        {link(
          'a',
          discussionLink,
          `Last active ${formatLastUpdated(getLastUpdated(proposal))}`
        )}
      </div>,
      isHot(proposal) && (
        <div class="activity-icons">
          <span>🔥</span>
        </div>
      ),
    ];

    const rowMetadata = [
      <div class="discussion-row-right-meta">
        {m(UserGallery, {
          avatarSize: 36,
          popover: true,
          maxUsers: 2,
          addressesCount:
            app.threadUniqueAddressesCount.getAddressesCountRootId(
              `${proposal.slug}_${proposal.id}`
            ),
          users:
            app.threadUniqueAddressesCount.getUniqueAddressesByRootId(proposal),
        })}
      </div>,
      app.isLoggedIn() && (
        <div class="discussion-row-menu">
          {m(DiscussionRowMenu, { proposal })}
        </div>
      ),
    ];

    const reaction = (
      <ReactionButton
        post={proposal}
        type={ReactionType.Like}
        tooltip={true}
        large={true}
      />
    );

    return (
      <ListingRow
        reaction={reaction}
        header={rowHeader}
        subheader={rowSubheader}
        pinned={pinned}
        contentRight={rowMetadata}
        key={proposal.id}
        onclick={(e) => {
          if (vnode.attrs.onSelect) {
            return vnode.attrs.onSelect();
          }

          if ($(e.target).hasClass('cui-tag')) return;

          if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) return;

          e.preventDefault();

          localStorage[`${app.activeChainId()}-discussions-scrollY`] =
            window.scrollY;

          m.route.set(discussionLink);
        }}
      />
    );
  }
}
