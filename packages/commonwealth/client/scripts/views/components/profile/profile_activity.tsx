/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/profile/profile_activity.scss';

import type Thread from 'client/scripts/models/Thread';
import type Comment from 'client/scripts/models/Comment';
import type { IUniqueId } from 'client/scripts/models/interfaces';
import { CWTab, CWTabBar } from '../component_kit/cw_tabs';
import { ProfileActivityContent } from './profile_activity_content';
import type { AddressAccount } from 'models';

enum ProfileActivityType {
  Addresses,
  Comments,
  Communities,
  Threads,
}

export type CommentWithAssociatedThread = Comment<IUniqueId> & {
  thread: Thread;
};

type ProfileActivityAttrs = {
  addresses: AddressAccount[];
  comments: CommentWithAssociatedThread[];
  threads: Thread[];
};

export class ProfileActivity extends ClassComponent<ProfileActivityAttrs> {
  private address: string;
  private selectedActivity: ProfileActivityType;

  oninit() {
    this.address = m.route.param('address');
    this.selectedActivity = ProfileActivityType.Comments;
  }

  view(vnode: m.Vnode<ProfileActivityAttrs>) {
    return (
      <div className="ProfileActivity">
        <div className="activity-nav">
          <CWTabBar>
            <CWTab
              label="All Activity"
              onclick={() => {
                this.selectedActivity = ProfileActivityType.Comments;
              }}
              isSelected={
                this.selectedActivity === ProfileActivityType.Comments
              }
            />
            <CWTab
              label={
                <div className="tab-header">
                  Threads
                  <div className="count">{vnode.attrs.threads.length}</div>
                </div>
              }
              onclick={() => {
                this.selectedActivity = ProfileActivityType.Threads;
              }}
              isSelected={this.selectedActivity === ProfileActivityType.Threads}
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
          <ProfileActivityContent
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
