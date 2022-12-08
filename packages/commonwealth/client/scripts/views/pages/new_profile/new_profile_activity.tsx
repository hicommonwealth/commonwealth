/* @jsx m */

import m from 'mithril';
import moment from 'moment';
import app from 'state';
import ClassComponent from 'class_component';

import Thread from 'client/scripts/models/Thread';
import ChainInfo from 'client/scripts/models/ChainInfo';
import Comment from 'client/scripts/models/Comment';
import AddressInfo from 'client/scripts/models/AddressInfo';
import { IUniqueId } from 'client/scripts/models/interfaces';

import 'pages/new_profile.scss';

import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTag } from '../../components/component_kit/cw_tag';
import { SharePopover } from '../../components/share_popover';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';

enum ProfileActivity {
  Comments,
  Threads,
  Communities,
  Addresses,
}

type NewProfileActivityAttrs = {
  threads: Array<Thread>;
  comments: Array<Comment<IUniqueId>>;
  chains: Array<ChainInfo>;
  addresses: Array<AddressInfo>;
};

type NewProfileActivityContentAttrs = {
  option: ProfileActivity;
  attrs: NewProfileActivityAttrs;
  commentCharLimit: number;
  threadCharLimit: number;
  address: string;
}

type NewProfileActivityRowAttrs = {
  activity: Comment<IUniqueId> | Thread;
  charLimit: number;
  address: string;
}

const ActivityRow: m.Component<NewProfileActivityRowAttrs> = {
  view: (vnode) => {
    const { charLimit, activity, address } = vnode.attrs;
    const { chain, createdAt, plaintext, author, title } = activity;

    // force redraw or on initial load comments don't render
    m.redraw();

    return (
      <div className="activity">
        <div className="chain-info">
          <CWText fontWeight="semiBold">
            {chain}
          </CWText>
          <div className="dot">
            .
          </div>
          <CWTag
            label={author.slice(0, 5)}
          />
          <div className="dot">
            .
          </div>
          <div className="date">
            <CWText
              type="caption"
              fontWeight="medium"
            >{moment(createdAt).format('MM/DD/YYYY')}</CWText>
          </div>
        </div>
        <CWText className="title">
          {(activity as Thread).kind ? 'Created a thread' : 'Commented on the thread'}
          <CWText fontWeight="semiBold">&nbsp;{title}</CWText>
        </CWText>
        <CWText type="b2" className="gray-text">
          {plaintext.length > charLimit
            ? `${plaintext.slice(0, charLimit)}...`
            : plaintext}
        </CWText>
        <div className="actions">
          <SharePopover />

      {app.user.addresses
        .map((addressInfo) => addressInfo.address)
        .includes(address)
        && (
          <CWPopoverMenu
            trigger={
              <CWIconButton
                iconName="dotsVertical"
                iconSize="small"
              />
            }
            menuItems={[
              { label: 'Edit', iconLeft: 'write' },
              { label: 'Delete', iconLeft: 'trash' },
            ]}
          />
        )}
        </div>
      </div>
    )
  }
}

const ActivityContent: m.Component<NewProfileActivityContentAttrs> = {
  view: (vnode) => {
    const { option, attrs, commentCharLimit, threadCharLimit, address } = vnode.attrs;

    if (option === ProfileActivity.Comments) {
      return attrs.comments
        .map((comment) => (
          m(ActivityRow, { activity: comment, charLimit: commentCharLimit, address })
        ));
      }

      if (option === ProfileActivity.Threads) {
        return attrs.threads
          .map((thread) => (
            m(ActivityRow, { activity: thread, charLimit: threadCharLimit, address })
          ));
      }
  }
}


export class NewProfileActivity extends ClassComponent<NewProfileActivityAttrs> {
  private address: string;
  private selectedActivity: ProfileActivity;
  private commentCharLimit: number;
  private threadCharLimit: number;

  oninit(vnode: m.Vnode<NewProfileActivityAttrs>) {
    this.address = m.route.param('address');
    this.selectedActivity = ProfileActivity.Comments;
    this.commentCharLimit = window.innerWidth > 1024 ? 240 : 140;
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
          <CWTabBar
            className="tab-bar"
          >
            <CWTab
              label="All Activity"
              onclick={() => {
                this.selectedActivity = ProfileActivity.Comments
              }}
              isSelected={this.selectedActivity === ProfileActivity.Comments}
            />
            <CWTab
              label="Threads"
              onclick={() => {
                this.selectedActivity = ProfileActivity.Threads
              }}
              isSelected={this.selectedActivity === ProfileActivity.Threads}
            />
            <div className="divider" />
            <CWTab
              label="Communities"
              onclick={() => {
                this.selectedActivity = ProfileActivity.Communities
              }}
              isSelected={this.selectedActivity === ProfileActivity.Communities}
            />
            <CWTab
              label="Addresses"
              onclick={() => {
                this.selectedActivity = ProfileActivity.Addresses
              }}
              isSelected={this.selectedActivity === ProfileActivity.Addresses}
            />
          </CWTabBar>
        </div>
        <div className="activity-section">
          {m(ActivityContent, {
            option: this.selectedActivity,
            attrs: vnode.attrs,
            commentCharLimit: this.commentCharLimit,
            threadCharLimit: this.threadCharLimit,
            address: this.address,
          })}
        </div>
      </div>
    );
  }
}

export default NewProfileActivity;
