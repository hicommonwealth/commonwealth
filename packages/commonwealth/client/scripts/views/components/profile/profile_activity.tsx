import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';

import 'components/profile/profile_activity.scss';

import type Thread from 'client/scripts/models/Thread';
import type Comment from 'client/scripts/models/Comment';
import type AddressInfo from 'client/scripts/models/AddressInfo';
import type { IUniqueId } from 'client/scripts/models/interfaces';
import { CWTab, CWTabBar } from '../component_kit/cw_tabs';
import ProfileActivityContent from './profile_activity_content';

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
  addresses: AddressInfo[];
  comments: CommentWithAssociatedThread[];
  threads: Thread[];
};

class ProfileActivity extends ClassComponent<ProfileActivityAttrs> {
  private selectedActivity: ProfileActivityType;

  oninit() {
    this.selectedActivity = ProfileActivityType.Comments;
  }

  view(vnode: ResultNode<ProfileActivityAttrs>) {
    return (
      <div className="ProfileActivity">
        <div className="activity-nav">
          <CWTabBar>
            <CWTab
              label="All Activity"
              onClick={() => {
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
              onClick={() => {
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
            threads={vnode.attrs.threads}
            comments={vnode.attrs.comments}
          />
        </div>
      </div>
    );
  }
}

export default ProfileActivity;
