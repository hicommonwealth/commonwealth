import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import { Spinner } from 'construct-ui';

import app from 'state';
import { pluralize } from 'helpers';
import { Thread, Account } from 'models';

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
    count: number;
  },
  {
    previousContent: any;
    onscroll;
  }
> = {
  // TODO: Add typeguards to ProposalComments so we can avoid the dirty indexing here
  oncreate: (vnode) => {
    if (window.location.hash) {
      const matches = window.location.hash.match(/#([0-9]+)/);
      if (!matches || isNaN(+matches[1])) return;

      vnode.attrs.count = +matches[1];
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

    return m('.ProfileContent', [
      content?.length > 0
        ? [
            content.slice(0, vnode.attrs.count).map((data) => {
              if (data instanceof Thread) {
                return m(ProfileProposal, { proposal: data });
              } else {
                return m(ProfileCommentGroup, {
                  proposal: data,
                  comments: [data],
                  account,
                });
              }
            }),
            postsRemaining(content.length, vnode.attrs.count)
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
