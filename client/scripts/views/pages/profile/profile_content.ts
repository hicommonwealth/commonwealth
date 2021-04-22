import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import { Spinner } from 'construct-ui';

import app from 'state';
import { pluralize } from 'helpers';
import { OffchainThread, Account } from 'models';

import { UserContent } from './index';
import ProfileCommentGroup from './profile_comment_group';
import ProfileProposal from './profile_proposal';

const postsRemaining = (contentLength, count) => {
  return contentLength > 10 && count < contentLength;
};

const ProfileContent: m.Component<
  {
    account: Account<any>;
    type: UserContent;
    content: any[];
    localStorageScrollYKey: string;
  },
  {
    count: number;
    previousContent: any;
    onscroll;
  }
> = {
  // TODO: Add typeguards to ProposalComments so we can avoid the dirty indexing here
  oncreate: (vnode) => {
    if (window.location.hash) {
      const matches = window.location.hash.match(/#([0-9]+)/);
      if (!matches || isNaN(+matches[1])) return;

      vnode.state.count = +matches[1];
      m.redraw();
      const scrollY = localStorage[vnode.attrs.localStorageScrollYKey];
      setTimeout(() => {
        if (app.lastNavigatedBack() && Number(scrollY)) {
          window.scrollTo(0, Number(scrollY));
        }
      }, 10);
    }
  },
  view: (vnode) => {
    const { account, type, content } = vnode.attrs;

    const newContent = type !== vnode.state.previousContent;

    if (newContent) {
      $(window).off('scroll');
      if (!vnode.state.count) {
        vnode.state.count = 10;
      }
      const thisUrl = m.route.get();
      vnode.state.onscroll = _.debounce(async () => {
        if (!postsRemaining(content.length, vnode.state.count)) return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > scrollHeight - 400) {
          vnode.state.count += 20;
          if (m.route.get() === thisUrl)
            window.location.hash = vnode.state.count.toString();
          m.redraw();
        }
      }, 400);

      vnode.state.previousContent = type;
      $(window).on('scroll', vnode.state.onscroll);
    }
    return m('.ProfileContent', [
      content?.length > 0
        ? [
            content.slice(0, vnode.state.count).map((data) => {
              if (data instanceof OffchainThread) {
                return m(ProfileProposal, { proposal: data });
              } else {
                return m(ProfileCommentGroup, {
                  proposal: data.proposal,
                  comments: [data],
                  account,
                });
              }
            }),
            postsRemaining(content.length, vnode.state.count)
              ? m('.infinite-scroll-spinner-wrap', [
                  m(Spinner, { active: true }),
                ])
              : m('.infinite-scroll-reached-end', [
                  `Showing ${content.length} of ${pluralize(
                    content.length,
                    type
                  )}`,
                ]),
          ]
        : m('.no-content', `No ${type} to display.`),
    ]);
  },
};

export default ProfileContent;
