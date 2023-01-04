/* @jsx m */

import m from 'mithril';
import moment from 'moment';
import ClassComponent from 'class_component';

import 'pages/new_profile/new_profile_activity.scss';

import app from 'state';
import { link } from 'helpers';
import Thread from 'client/scripts/models/Thread';
import ChainInfo from 'client/scripts/models/ChainInfo';
import Comment from 'client/scripts/models/Comment';
import AddressInfo from 'client/scripts/models/AddressInfo';
import { IUniqueId } from 'client/scripts/models/interfaces';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTag } from '../../components/component_kit/cw_tag';
import { SharePopover } from '../../components/share_popover';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { EditComment } from '../../components/comments/edit_comment';

enum ProfileActivity {
  Addresses,
  Comments,
  Communities,
  Threads,
}

type CommentWithAssociatedThread = Comment<IUniqueId> & {
  thread: Thread;
}

type NewProfileActivityAttrs = {
  addresses: Array<AddressInfo>;
  comments: Array<CommentWithAssociatedThread>;
  chains: Array<ChainInfo>;
  threads: Array<Thread>;
};

type NewProfileActivityContentAttrs = {
  address: string;
  attrs: NewProfileActivityAttrs;
  commentCharLimit: number;
  option: ProfileActivity;
  threadCharLimit: number;
};

type NewProfileActivityRowAttrs = {
  activity: CommentWithAssociatedThread | Thread;
  address: string;
  charLimit: number;
};

class ActivityRow extends ClassComponent<NewProfileActivityRowAttrs> {
  private isEditing: boolean;
  private currentActivity: CommentWithAssociatedThread | Thread;

  oninit(vnode: m.Vnode<NewProfileActivityRowAttrs>) {
    this.isEditing = false;
    this.currentActivity = vnode.attrs.activity;
  }

  view(vnode: m.Vnode<NewProfileActivityRowAttrs>) {
    const { activity, address, charLimit } = vnode.attrs;
    const { chain, createdAt, plaintext, author, title, id } = activity;
    const isThread = (activity as Thread).kind;
    const comment = this.currentActivity as CommentWithAssociatedThread;

    return (
      <div className="activity">
        <div className="chain-info">
          <CWText fontWeight="semiBold">{chain}</CWText>
          <div className="dot">.</div>
          <CWTag label={author.slice(0, 5)} />
          <div className="dot">.</div>
          <div className="date">
            <CWText type="caption" fontWeight="medium">
              {moment(createdAt).format('MM/DD/YYYY')}
            </CWText>
          </div>
        </div>
        <CWText className="title">
          {isThread
            ? 'Created a thread'
            : 'Commented on the thread'}
          <CWText fontWeight="semiBold" className="link">
            &nbsp;{isThread
              ? link('a', `/${chain}/discussion/${id}`, [
                  `${title}`,
                ])
              : link('a',`/${chain}/discussion/${comment.thread.id}`,[
                `${decodeURIComponent(comment.thread.title)}`,
              ])
            }
          </CWText>
        </CWText>
        { this.isEditing ? (
          <EditComment
            comment={comment}
            setIsEditing={(status: boolean) => {
              this.isEditing = status
            }}
            shouldRestoreEdits={false}
            updatedCommentsCallback={() => {
              this.currentActivity = {
                ...app.comments
                  .getById(comment.id),
                thread: comment.thread,
              };
              this.isEditing = false;
              m.redraw();
            }}
          />
        ) : (
          <CWText type="b2" className="gray-text">
            {isThread ? (
              plaintext
            ) : renderQuillTextBody(comment.text)}
          </CWText>
        )}
        <div className="actions">
          <SharePopover commentId={id}/>
          {app.user.addresses
            .map((addressInfo) => addressInfo.address)
            .includes(address) && (
            <CWPopoverMenu
              trigger={
                <CWIconButton iconName="dotsVertical" iconSize="small" />
              }
              menuItems={[
                // TODO: add edit functionality
                // {
                //   label: 'Edit',
                //   iconLeft: 'write',
                //   onclick: () => {
                //     this.isEditing = true;
                //   }
                // },
                {
                  label: 'Delete',
                  iconLeft: 'trash',
                  onclick: () => {
                    app.comments.delete(comment).then(() => {
                      m.redraw();
                    });
                  },
                },
              ]}
            />
          )}
        </div>
      </div>
    );
  }
}

class ActivityContent extends ClassComponent<NewProfileActivityContentAttrs> {
  view(vnode: m.Vnode<NewProfileActivityContentAttrs>) {
    const { option, attrs, commentCharLimit, threadCharLimit, address } =
      vnode.attrs;

    if (option === ProfileActivity.Threads) {
      return attrs.threads.map((thread) => (
        <ActivityRow
          activity={thread}
          charLimit={threadCharLimit}
          address={address}
        />
      ));
    }

    const allActivities: Array<CommentWithAssociatedThread | Thread> = [...attrs.comments, ...attrs.threads].sort(
      (a, b) => +b.createdAt - +a.createdAt
    );

    return allActivities.map((activity) => {
      return (
        <ActivityRow
          activity={activity}
          charLimit={commentCharLimit}
          address={address}
        />
      );
    });
  }
}

export class NewProfileActivity extends ClassComponent<NewProfileActivityAttrs> {
  private address: string;
  private commentCharLimit: number;
  private selectedActivity: ProfileActivity;
  private threadCharLimit: number;

  oninit() {
    this.address = m.route.param('address');
    this.commentCharLimit = window.innerWidth > 1024 ? 240 : 140;
    this.selectedActivity = ProfileActivity.Comments;
    this.threadCharLimit = window.innerWidth > 1024 ? 150 : 55;

    // Handle text character limit
    window.addEventListener('resize', () => {
      this.commentCharLimit = window.innerWidth > 1024 ? 240 : 140;
      this.threadCharLimit = window.innerWidth > 1024 ? 150 : 55;
    });
  }

  view(vnode: m.Vnode<NewProfileActivityAttrs>) {
    return (
      <div className="ProfileActivity">
        <div className="activity-nav">
          <CWTabBar className="tab-bar">
            <CWTab
              label="All Activity"
              onclick={() => {
                this.selectedActivity = ProfileActivity.Comments;
              }}
              isSelected={this.selectedActivity === ProfileActivity.Comments}
            />
            <CWTab
              label="Threads"
              onclick={() => {
                this.selectedActivity = ProfileActivity.Threads;
              }}
              isSelected={this.selectedActivity === ProfileActivity.Threads}
            />
            <div className="divider" />
            <CWTab
              label="Communities"
              onclick={() => {
                this.selectedActivity = ProfileActivity.Communities;
              }}
              isSelected={this.selectedActivity === ProfileActivity.Communities}
            />
            <CWTab
              label="Addresses"
              onclick={() => {
                this.selectedActivity = ProfileActivity.Addresses;
              }}
              isSelected={this.selectedActivity === ProfileActivity.Addresses}
            />
          </CWTabBar>
        </div>
        <div className="activity-section">
          <ActivityContent
            option={this.selectedActivity}
            attrs={vnode.attrs}
            commentCharLimit={this.commentCharLimit}
            threadCharLimit={this.threadCharLimit}
            address={this.address}
          />
        </div>
      </div>
    );
  }
}
