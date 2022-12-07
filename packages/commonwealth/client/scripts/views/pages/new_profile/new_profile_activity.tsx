/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import Thread from 'client/scripts/models/Thread';
import ChainInfo from 'client/scripts/models/ChainInfo';
import Comment from 'client/scripts/models/Comment';
import AddressInfo from 'client/scripts/models/AddressInfo';
import { IUniqueId } from 'client/scripts/models/interfaces';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

import 'pages/new_profile.scss';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';

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

const ActivityContent: m.Component<NewProfileActivityContentAttrs> = {
  view: (vnode) => {
    const { option, attrs, state } = vnode.attrs;

    // force redraw or on initial load comments don't render
    // m.redraw();

    if (option === ProfileActivity.Comments) {
      return attrs.comments
        .map((comment) => (
          <div className="activity">
            <div className="comment-chain">
              <CWText>
                Commented in <CWText fontWeight="semiBold">&nbsp;{comment.chain}</CWText>
              </CWText>
            </div>
            <div className="comment-date">
              <CWText>
                {moment(comment.createdAt).format('MM/DD/YYYY')}
              </CWText>
            </div>
            <CWText type="b2" className="gray-text">
              {comment.plaintext.length > state.commentCharLimit
                ? `${comment.plaintext.slice(0, state.commentCharLimit)}...`
                : comment.plaintext}
            </CWText>
          </div>
        ));
      }

      if (option === ProfileActivity.Threads) {
        return attrs.threads
          .map((thread) => (
            <div className="activity">
              <div className="chain-info">
                <CWText fontWeight="semiBold">
                  {thread.chain}
                </CWText>
                <CWText>
                  {thread.author.slice(0, 5)}
                </CWText>
              </div>
              <CWText>
                Created a thread
                <CWText fontWeight="semiBold">&nbsp;{thread.title} </CWText>
              </CWText>
              <div className="thread-date">
                <CWText>{moment(thread.createdAt).format('MM/DD/YYYY')}</CWText>
              </div>
              <CWText type="b2" className="gray-text">
                {thread.plaintext.length > state.threadCharLimit
                  ? `${thread.plaintext.slice(0, state.threadCharLimit)}...`
                  : thread.plaintext}
              </CWText>
            </div>
          ));
      }
  }
}

const NewProfileActivity: m.Component<NewProfileActivityAttrs, NewProfileActivityState> = {
  oninit(vnode: m.Vnode<NewProfileActivityAttrs, NewProfileActivityState>) {
    vnode.state.selectedActivity = ProfileActivity.Comments;
    vnode.state.commentCharLimit = window.innerWidth > 1024 ? 240 : 140;
    vnode.state.threadCharLimit = window.innerWidth > 1024 ? 150 : 55;

    // Handle text character limit
    window.addEventListener('resize', () => {
      vnode.state.commentCharLimit = window.innerWidth > 1024 ? 300 : 140;
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
