/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/discussions/thread_preview.scss';

import app from 'state';
import { getProposalUrlPath } from 'identifiers';
import { slugify } from 'utils';
import { isCommandClick } from 'helpers';
import { AddressInfo, Thread } from 'models';
import { ThreadPreviewReactionButton } from '../../components/reaction_button/thread_preview_reaction_button';
import User from '../../components/widgets/user';
import { CWText } from '../../components/component_kit/cw_text';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { SharePopover } from '../../components/share_popover';
import { ThreadPreviewMenu } from './thread_preview_menu';

type ThreadPreviewAttrs = {
  thread: Thread;
};

export class _ThreadPreview implements m.ClassComponent<ThreadPreviewAttrs> {
  view(vnode: m.VnodeDOM<ThreadPreviewAttrs, this>) {
    const { thread } = vnode.attrs;

    const commentsCount = app.comments.nComments(thread);

    const discussionLink = getProposalUrlPath(
      thread.slug,
      `${thread.identifier}-${slugify(thread.title)}`
    );

    return (
      <div
        class="ThreadPreview"
        onclick={(e) => {
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
        <ThreadPreviewReactionButton thread={thread} />
        <div class="main-content">
          <div class="user-and-date-row">
            {m(User, {
              avatarSize: 24,
              user: new AddressInfo(
                null,
                thread.author,
                thread.authorChain,
                null
              ),
              linkify: true,
              popover: false,
              showAddressWithDisplayName: true,
              hideIdentityIcon: true,
            })}
            <CWText className="last-updated-text">•</CWText>
            <CWText
              type="caption"
              fontWeight="medium"
              className="last-updated-text"
            >
              {moment(thread.createdAt).format('l')}
            </CWText>
            {thread.pinned && <CWIcon iconName="pin" />}
          </div>
          <CWText type="h5" fontWeight="semiBold">
            {thread.title}
          </CWText>
          <div class="row-bottom">
            <div class="comments-count">
              <CWIcon iconName="feedback" iconSize="small" />
              <CWText type="caption">{commentsCount} comments</CWText>
            </div>
            <div class="row-bottom-menu">
              <SharePopover />
              {app.isLoggedIn() && <ThreadPreviewMenu thread={thread} />}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
