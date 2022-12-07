/* @jsx m */

import m from 'mithril';
import moment from 'moment';
import app from 'state';

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

type NewProfileActivityState = {
  address: string;
  selectedActivity: ProfileActivity;
  isCommunitiesOpen: boolean;
  isAddressesOpen: boolean;
  commentCharLimit: number;
  threadCharLimit: number;
};

type NewProfileActivityContentAttrs = {
  option: ProfileActivity,
  attrs: NewProfileActivityAttrs,
  state: NewProfileActivityState,
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

    console.log('address', address);
    console.log('app address', app.user.addresses)

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
    const { option, attrs, state } = vnode.attrs;

    // force redraw or on initial load comments don't render
    // m.redraw();

    if (option === ProfileActivity.Comments) {
      return attrs.comments
        .map((comment) => (
          m(ActivityRow, { activity: comment, charLimit: state.commentCharLimit, address: state.address })
        ));
      }

      if (option === ProfileActivity.Threads) {
        return attrs.threads
          .map((thread) => (
            m(ActivityRow, { activity: thread, charLimit: state.threadCharLimit, address: state.address })
          ));
      }
  }
}

const NewProfileActivity: m.Component<NewProfileActivityAttrs, NewProfileActivityState> = {
  oninit(vnode: m.Vnode<NewProfileActivityAttrs, NewProfileActivityState>) {
    vnode.state.address = m.route.param('address');
    vnode.state.selectedActivity = ProfileActivity.Comments;
    vnode.state.commentCharLimit = window.innerWidth > 1024 ? 240 : 140;
    vnode.state.threadCharLimit = window.innerWidth > 1024 ? 150 : 55;

    // Handle text character limit
    window.addEventListener('resize', () => {
      vnode.state.commentCharLimit = window.innerWidth > 1024 ? 240 : 140;
      vnode.state.threadCharLimit = window.innerWidth > 1024 ? 150 : 55;
    });
  },

  view(vnode: m.Vnode<NewProfileActivityAttrs, NewProfileActivityState>) {
    return (
      <div className="ProfileActivity">
        <div className="activity-nav">
          <CWTabBar
            className="tab-bar"
          >
            <CWTab
              label="All Activity"
              onclick={() => {
                vnode.state.selectedActivity = ProfileActivity.Comments
              }}
              isSelected={vnode.state.selectedActivity === ProfileActivity.Comments}
            />
            <CWTab
              label="Threads"
              onclick={() => {
                vnode.state.selectedActivity = ProfileActivity.Threads
              }}
              isSelected={vnode.state.selectedActivity === ProfileActivity.Threads}
            />
            <div className="divider" />
            <CWTab
              label="Communities"
              onclick={() => {
                vnode.state.selectedActivity = ProfileActivity.Communities
              }}
              isSelected={vnode.state.selectedActivity === ProfileActivity.Communities}
            />
            <CWTab
              label="Addresses"
              onclick={() => {
                vnode.state.selectedActivity = ProfileActivity.Addresses
              }}
              isSelected={vnode.state.selectedActivity === ProfileActivity.Addresses}
            />
          </CWTabBar>
        </div>
        <div className="activity-section">
          {m(ActivityContent, {
            option: vnode.state.selectedActivity,
            attrs: vnode.attrs,
            state: vnode.state,
          })}
        </div>
      </div>
    );
  }
}

export default NewProfileActivity;
