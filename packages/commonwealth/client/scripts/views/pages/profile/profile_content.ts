import { pluralize } from 'helpers';
import type { Account } from 'models';
import { Thread } from 'models';

import app from 'state';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import type { Component } from 'mithrilInterop';
import { render, redraw } from 'mithrilInterop';

import type { UserContent } from './index';
import ProfileCommentGroup from './profile_comment_group';
import ProfileProposal from './profile_proposal';

const postsRemaining = (contentLength, count) => {
  return contentLength > 10 && count < contentLength;
};

const ProfileContent: Component<
  {
    account: Account;
    type: UserContent;
    content: any[];
    localStorageScrollYKey: string;
    count: number;
  },
  {
    previousContent: any;
    onScroll;
  }
> = {
  // TODO: Add typeguards to ProposalComments so we can avoid the dirty indexing here
  oncreate: (vnode) => {
    if (window.location.hash) {
      const matches = window.location.hash.match(/#([0-9]+)/);
      if (!matches || isNaN(+matches[1])) return;

      vnode.attrs.count = +matches[1];
      redraw();
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

    return render('.ProfileContent', [
      content?.length > 0
        ? [
            content.slice(0, vnode.attrs.count).map((data) => {
              if (data instanceof Thread) {
                return render(ProfileProposal, { proposal: data });
              } else {
                return render(ProfileCommentGroup, {
                  proposal: data,
                  comments: [data],
                  account,
                });
              }
            }),
            postsRemaining(content.length, vnode.attrs.count)
              ? render('.infinite-scroll-spinner-wrap', [render(CWSpinner)])
              : render('.infinite-scroll-reached-end', [
                  `Showing ${content.length} of ${pluralize(
                    content.length,
                    type
                  )}`,
                ]),
          ]
        : render('.no-content', `No ${type} to display.`),
    ]);
  },
};

export default ProfileContent;
