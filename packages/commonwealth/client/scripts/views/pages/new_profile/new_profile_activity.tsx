/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/new_profile/new_profile_activity.scss';

import Thread from 'client/scripts/models/Thread';
import ChainInfo from 'client/scripts/models/ChainInfo';
import Comment from 'client/scripts/models/Comment';
import AddressInfo from 'client/scripts/models/AddressInfo';
import { IUniqueId } from 'client/scripts/models/interfaces';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { ActivityContent } from './new_profile_activity_content';

enum ProfileActivity {
  Addresses,
  Comments,
  Communities,
  Threads,
}

export type CommentWithAssociatedThread = Comment<IUniqueId> & {
  thread: Thread;
}

type NewProfileActivityAttrs = {
  addresses: Array<AddressInfo>;
  comments: Array<CommentWithAssociatedThread>;
  chains: Array<ChainInfo>;
  threads: Array<Thread>;
};

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
            {/* TODO: uncomment when communities are ready */}
            {/* <div className="divider" />
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
            /> */}
          </CWTabBar>
        </div>
        <div className="activity-section">
          <ActivityContent
            option={this.selectedActivity}
            commentCharLimit={this.commentCharLimit}
            threadCharLimit={this.threadCharLimit}
            address={this.address}
            threads={vnode.attrs.threads}
            comments={vnode.attrs.comments}
          />
        </div>
      </div>
    );
  }
}
