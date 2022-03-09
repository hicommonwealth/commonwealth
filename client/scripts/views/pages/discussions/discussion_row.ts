import 'pages/discussions/discussion_row.scss';

import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import { Button, Icon, Icons, Tag } from 'construct-ui';

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

export const getLastUpdated = (proposal) => {
  const { lastCommentedOn } = proposal;
  const lastComment = lastCommentedOn ? Number(lastCommentedOn.utc()) : 0;
  const createdAt = Number(proposal.createdAt.utc());
  const lastUpdate = Math.max(createdAt, lastComment);
  return moment(lastUpdate);
};

export const isHot = (proposal) => {
  return (
    moment.duration(moment().diff(getLastUpdated(proposal))).asSeconds() <
    24 * 60 * 60
  );
};

const DiscussionRow: m.Component<
  { proposal: OffchainThread; onSelect?: any },
  { expanded: boolean }
> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;

    if (!proposal) return;

    const propType: OffchainThreadKind = proposal.kind;

    const pinned = proposal.pinned;

    const discussionLink = getProposalUrlPath(
      proposal.slug,
      `${proposal.identifier}-${slugify(proposal.title)}`
    );

    const rowHeader: any = link('a', discussionLink, proposal.title);

    const rowSubheader = [
      proposal.readOnly && [
        m('.discussion-locked', [
          m(Tag, {
            size: 'xs',
            label: [m(Icon, { name: Icons.LOCK, size: 'xs' })],
          }),
        ]),
      ],
      proposal instanceof OffchainThread &&
        proposal.offchainVotingEnabled && [
          m(Button, {
            class: 'discussion-row-linked-poll',
            label: 'Poll',
            contentRight: pluralize(proposal.offchainVotingNumVotes, 'vote'),
            intent: 'warning',
            size: 'xs',
            compact: true,
          }),
        ],
      proposal.chainEntities?.length > 0 && [
        proposal.chainEntities
          .sort((a, b) => {
            return +a.typeId - +b.typeId;
          })
          .map((ce) => {
            if (!chainEntityTypeToProposalShortName(ce.type)) return;
            return m(Button, {
              class: 'discussion-row-linked-chain-entity',
              label: [
                chainEntityTypeToProposalShortName(ce.type),
                Number.isNaN(parseInt(ce.typeId, 10)) ? '' : ` #${ce.typeId}`,
              ],
              intent: 'primary',
              size: 'xs',
              compact: true,
            });
          }),
      ],
      proposal.snapshotProposal &&
        m(Button, {
          class: 'discussion-row-linked-chain-entity',
          label: ['Snap ', `${proposal.snapshotProposal.slice(0, 4)}…`],
          intent: 'primary',
          size: 'xs',
          compact: true,
        }),
      proposal instanceof OffchainThread &&
        proposal.stage !== OffchainThreadStage.Discussion &&
        m(Button, {
          class: 'discussion-row-stage-btn',
          intent:
            proposal.stage === OffchainThreadStage.ProposalInReview
              ? 'positive'
              : proposal.stage === OffchainThreadStage.Voting
              ? 'positive'
              : proposal.stage === OffchainThreadStage.Passed
              ? 'positive'
              : proposal.stage === OffchainThreadStage.Failed
              ? 'negative'
              : 'positive',
          size: 'xs',
          compact: true,
          label: offchainThreadStageToLabel(proposal.stage),
        }),
      proposal instanceof OffchainThread &&
        (proposal.stage !== OffchainThreadStage.Discussion ||
          proposal.chainEntities?.length > 0 ||
          proposal.offchainVotingEndsAt ||
          proposal.offchainVotingNumVotes ||
          proposal.readOnly) &&
        ' ', // en space
      propType === OffchainThreadKind.Link &&
        proposal.url && [
          externalLink(
            'a.external-discussion-link',
            proposal.url,
            `Link: ${extractDomain(proposal.url)}`
          ),
          ' ', // em space
        ],
      proposal.topic && [
        link(
          'a.proposal-topic',
          `/${app.activeChainId()}/discussions/${proposal.topic.name}`,
          [m('span.proposal-topic-name', `${proposal.topic.name}`)]
        ),
        ' ', // em space
      ],
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
        proposal.collaborators.length > 0 && [
          ' ', // regular space
          m(
            'span.proposal-collaborators',
            ` +${proposal.collaborators.length}`
          ),
        ],
      ' ', // em space
      m(
        '.last-active.created-at',
        link(
          'a',
          discussionLink,
          `Last active ${formatLastUpdated(getLastUpdated(proposal))}`
        )
      ),
      // activity icons
      m('.activity-icons', [
        ' ', // en space
        isHot(proposal) && m('span', '🔥'),
      ]),
    ] as any;

    const rowMetadata = [
      m('.discussion-row-right-meta', [
        m(UserGallery, {
          avatarSize: 36,
          popover: true,
          maxUsers: 2,
          addressesCount:
            app.threadUniqueAddressesCount.getAddressesCountRootId(
              `${proposal.slug}_${proposal.id}`
            ),
          users:
            app.threadUniqueAddressesCount.getUniqueAddressesByRootId(proposal),
        }),
      ]),
      app.isLoggedIn() &&
        m('.discussion-row-menu', [m(DiscussionRowMenu, { proposal })]),
    ];

    const reaction = m(ReactionButton, {
      post: proposal,
      type: ReactionType.Like,
      tooltip: true,
      large: true,
    });

    return m(ListingRow, {
      contentLeft: {
        reaction,
        header: rowHeader,
        subheader: rowSubheader,
        pinned,
      },
      contentRight: rowMetadata,
      key: proposal.id,
      onclick: (e) => {
        if (vnode.attrs.onSelect) {
          return vnode.attrs.onSelect();
        }
        if ($(e.target).hasClass('cui-tag')) return;
        if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) return;
        e.preventDefault();
        localStorage[`${app.activeChainId()}-discussions-scrollY`] =
          window.scrollY;
        m.route.set(discussionLink);
      },
    });
  },
};

export default DiscussionRow;
