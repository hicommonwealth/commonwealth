import 'pages/discussions/discussion_row.scss';

import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import { Button, Icon, Icons, Tag } from 'construct-ui';

import { slugify } from 'utils';
import app from 'state';
import { chainEntityTypeToProposalShortName } from 'identifiers';
import {
  formatLastUpdated, link, externalLink, extractDomain, pluralize,
  offchainThreadStageToLabel
} from 'helpers';

import { OffchainThread, OffchainThreadKind, OffchainThreadStage, AddressInfo } from 'models';
import ReactionButton, { ReactionType } from 'views/components/reaction_button';
import User from 'views/components/widgets/user';
import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import UserGallery from 'views/components/widgets/user_gallery';
import ListingRow from 'views/components/listing_row';

import DiscussionRowMenu from './discussion_row_menu';

const getLastUpdated = (proposal) => {
  const lastComment = Number(app.comments.lastCommented(proposal));
  const createdAt = Number(proposal.createdAt.utc());
  const lastUpdate = Math.max(createdAt, lastComment);
  return moment(lastUpdate);
};

const DiscussionRow: m.Component<{ proposal: OffchainThread, showExcerpt?: boolean }, { expanded: boolean }> = {
  view: (vnode) => {
    const { proposal, showExcerpt } = vnode.attrs;
    if (!proposal) return;
    const propType: OffchainThreadKind = proposal.kind;
    const pinned = proposal.pinned;
    const discussionLink = `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-`
      + `${slugify(proposal.title)}`;

    const rowHeader: any = [
      (propType === OffchainThreadKind.Link && proposal.url)
        && externalLink('a.external-discussion-link', proposal.url, [
          extractDomain(proposal.url),
        ]),
      (propType === OffchainThreadKind.Link && proposal.url)
        && m('span.spacer', ' '),
      link('a', discussionLink, proposal.title),
      m('span.spacer', m.trust(' &nbsp; ')),
      proposal instanceof OffchainThread
        && proposal.stage !== OffchainThreadStage.Discussion
        && [
          m(Button, {
            class: 'discussion-row-stage',
            label: offchainThreadStageToLabel(proposal.stage),
            intent: proposal.stage === OffchainThreadStage.ProposalInReview ? 'positive'
              : proposal.stage === OffchainThreadStage.Voting ? 'positive'
                : proposal.stage === OffchainThreadStage.Passed ? 'positive'
                  : proposal.stage === OffchainThreadStage.Failed ? 'negative'
                    : proposal.stage === OffchainThreadStage.Abandoned ? 'negative' : 'none',
            size: 'xs',
            rounded: true,
            compact: true,
          }),
        ],
      proposal instanceof OffchainThread
        && (proposal.offchainVotingEndsAt || proposal.offchainVotingNumVotes)
        && [
          m(Button, {
            class: 'discussion-row-linked-poll',
            label: 'Poll',
            contentRight: pluralize(proposal.offchainVotingNumVotes, 'vote'),
            intent: 'warning',
            size: 'xs',
            rounded: true,
            compact: true,
          }),
        ],
      proposal.chainEntities?.length > 0 && [
        proposal.chainEntities.map((ce) => {
          if (!chainEntityTypeToProposalShortName(ce.type)) return;
          return m(Button, {
            class: 'discussion-row-linked-chain-entity',
            label: [
              chainEntityTypeToProposalShortName(ce.type),
              Number.isNaN(parseInt(ce.typeId, 10)) ? '' : ` #${ce.typeId}`,
            ],
            intent: 'primary',
            size: 'xs',
            rounded: true,
            compact: true,
          });
        }),
      ],
    ];
    const rowSubheader = [
      proposal.readOnly && m('.discussion-locked', [
        m(Tag, {
          size: 'xs',
          label: [
            m(Icon, { name: Icons.LOCK, size: 'xs' }),
          ],
        }),
      ]),
      proposal.topic && link('a.proposal-topic', `/${app.activeId()}/discussions/${proposal.topic.name}`, [
        m('span.proposal-topic-name', `${proposal.topic.name}`),
      ]),
      m(User, {
        user: new AddressInfo(null, proposal.author, proposal.authorChain, null),
        linkify: true,
        popover: true,
        hideAvatar: true,
        showAddressWithDisplayName: true,
      }),
      proposal instanceof OffchainThread && proposal.collaborators && proposal.collaborators.length > 0
        && m('span.proposal-collaborators', [ ' +', proposal.collaborators.length ]),
      m('.created-at', link('a', discussionLink, `Last active ${formatLastUpdated(getLastUpdated(proposal))}`)),
      m('.mobile-comment-count', [
        m(Icon, { name: Icons.MESSAGE_SQUARE }),
        app.comments.nComments(proposal),
      ]),
    ];

    const rowMetadata = [
      m('.discussion-row-right-meta', [
        m(UserGallery, {
          avatarSize: 20,
          popover: true,
          maxUsers: 4,
          users: app.comments.uniqueCommenters(
            proposal,
            proposal.author,
            proposal.authorChain
          )
        }),
      ]),
      app.isLoggedIn() && m('.discussion-row-menu', [
        m(DiscussionRowMenu, { proposal }),
      ]),
    ];

    const reaction = m(ReactionButton, {
      post: proposal,
      type: ReactionType.Like,
      tooltip: true,
      large: true,
    });

    return m(ListingRow, {
      class: 'DiscussionRow',
      contentLeft: {
        reaction,
        header: rowHeader,
        subheader: rowSubheader,
        pinned,
      },
      contentRight: rowMetadata,
      rightColSpacing: app.isLoggedIn() ? [10, 2] : [12],
      key: proposal.id,
      onclick: (e) => {
        if ($(e.target).hasClass('cui-tag')) return;
        if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) return;
        e.preventDefault();
        localStorage[`${app.activeId()}-discussions-scrollY`] = window.scrollY;
        m.route.set(discussionLink);
      },
    });
  }
};

export default DiscussionRow;
