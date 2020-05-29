import 'pages/discussions/discussion_row.scss';

import { default as m } from 'mithril';
import { default as _ } from 'lodash';
import { default as moment } from 'moment-twitter';

import app from 'state';
import { pluralize, slugify, link, externalLink, extractDomain } from 'helpers';
import { Icon, Icons, Tag, } from 'construct-ui';

import User from 'views/components/widgets/user';
import { OffchainThread, OffchainThreadKind, OffchainTag } from 'models';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import QuillFormattedText from 'views/components/quill_formatted_text';

import ThreadCaratMenu from './thread_carat_menu';


interface IAttrs {
  proposal: OffchainThread;
}

const formatLastUpdated = (timestamp) => {
  if (timestamp.isBefore(moment().subtract(365, 'days'))) return timestamp.format('MMM D YYYY');
  if (timestamp.isBefore(moment().subtract(30, 'days'))) return timestamp.format('MMM D');
  return timestamp.fromNow();
};

const DiscussionRow: m.Component<IAttrs> = {
  view: (vnode: m.VnodeDOM<IAttrs>) => {
    const proposal: OffchainThread = vnode.attrs.proposal;
    if (!proposal) return;
    const propType: OffchainThreadKind = proposal.kind;
    const lastUpdated = app.comments.lastCommented(proposal)
      || proposal.createdAt;

    const tagSortByName = (a, b) => {
      if (a.name > b.name) {
        return 1;
      } else if (a.name < b.name) {
        return -1;
      } else {
        return 0;
      }
    };

    return m('.DiscussionRow', { key: proposal.identifier }, [
      m('.discussion-row', [
        m('.discussion-pre', [
          m(User, {
            user: [proposal.author, proposal.authorChain],
            avatarOnly: true,
            avatarSize: 30,
            tooltip: true,
          }),
        ]),
        m('.discussion-pre-mobile', [
          m(User, {
            user: [proposal.author, proposal.authorChain],
            avatarOnly: true,
            avatarSize: 16,
            tooltip: true,
          }),
        ]),
        m('.discussion-content', {
          class: proposal.title === '--' ? 'no-title' : ''
        }, [
          m('.discussion-meta', [
            m('.discussion-meta-left', [
              m(User, {
                user: [proposal.author, proposal.authorChain],
                linkify: true,
                tooltip: true,
                hideAvatar: true,
              }),
              m('.discussion-last-updated', formatLastUpdated(lastUpdated)),
            ]),
            m('.discussion-meta-right', [
              m('.discussion-tags', [
                m(Tag, {
                  rounded: true,
                  intent: 'none',
                  label: proposal.tag.name,
                  size: 'xs',
                  onclick: (e) => m.route.set(`/${app.activeId()}/discussions/${proposal.tag.name}`),
                }),
                m(ThreadCaratMenu, { proposal }),
              ]),
            ]),
          ]),
          m('.discussion-title', [
            link('a',
              `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-${slugify(proposal.title)}`, [
                proposal.title
              ]),
            app.comments.nComments(proposal) > 0
              && link(
                'a.discussion-replies',
                `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-${slugify(proposal.title)}`,
                [ app.comments.nComments(proposal), m(Icon, { name: Icons.MESSAGE_SQUARE }) ],
              ),
          ]),
          propType === OffchainThreadKind.Link
            && proposal.url
            && externalLink('a.discussion-link', proposal.url, [
              extractDomain(proposal.url),
              m.trust(' &rarr;'),
            ]),
        ]),
      ]),
    ]);
  }
};

export default DiscussionRow;
