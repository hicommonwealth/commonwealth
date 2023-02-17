/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/profile/profile_activity.scss';

import type Thread from 'client/scripts/models/Thread';
import type Comment from 'client/scripts/models/Comment';
import type AddressInfo from 'client/scripts/models/AddressInfo';
import type { IUniqueId } from 'client/scripts/models/interfaces';
import { CWTab, CWTabBar } from '../component_kit/cw_tabs';
import { NewProfileActivityContent } from './profile_activity_content';

enum ProfileActivity {
  Addresses,
  Comments,
  Communities,
  Threads,
}

export type CommentWithAssociatedThread = Comment<IUniqueId> & {
  thread: Thread;
};

type NewProfileActivityAttrs = {
  addresses: AddressInfo[];
  comments: CommentWithAssociatedThread[];
  threads: Thread[];
};

export class NewProfileActivity extends ClassComponent<NewProfileActivityAttrs> {
  private address: string;
  private selectedActivity: ProfileActivity;

  oninit() {
    this.address = m.route.param('address');
    this.selectedActivity = ProfileActivity.Comments;
  }

  view(vnode: m.Vnode<NewProfileActivityAttrs>) {
    return (
      <div className="ProfileActivity">
        <div className="activity-nav">
          <CWTabBar>
            <CWTab
              label="All Activity"
              onclick={() => {
                this.selectedActivity = ProfileActivity.Comments;
              }}
              isSelected={this.selectedActivity === ProfileActivity.Comments}
            />
            <CWTab
              label={
                <div className="tab-header">
                  Threads
                  <div className="count">{vnode.attrs.threads.length}</div>
                </div>
              }
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
        <div className="activity-content">
          <NewProfileActivityContent
            option={this.selectedActivity}
            address={this.address}
            threads={vnode.attrs.threads}
            comments={vnode.attrs.comments}
          />
        </div>
      </div>
    );
  }
}
