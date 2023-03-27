import React, { useState } from 'react';

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

type ProfileActivityProps = {
  addresses: AddressInfo[];
  comments: CommentWithAssociatedThread[];
  threads: Thread[];
};

const ProfileActivity = (props: ProfileActivityProps) => {
  const [selectedActivity, setSelectedActivity] = useState(
    ProfileActivityType.Comments
  );
  const { addresses, comments, threads } = props;

  return (
    <div className="ProfileActivity">
      <div className="activity-nav">
        <CWTabBar>
          <CWTab
            label="All Activity"
            onClick={() => {
              setSelectedActivity(ProfileActivityType.Comments);
            }}
            isSelected={selectedActivity === ProfileActivityType.Comments}
          />
          <CWTab
            label={
              <div className="tab-header">
                Threads
                <div className="count">{threads.length}</div>
              </div>
            }
            onClick={() => {
              setSelectedActivity(ProfileActivityType.Threads);
            }}
            isSelected={selectedActivity === ProfileActivityType.Threads}
          />
          {/* TODO: uncomment when communities are ready */}
          {/* <div className="divider" />
          <CWTab
            label="Communities"
            onclick={() => {
              this.selectedActivity = ProfileActivity.Communities;
            }}
            isSelected={this.selectedActivity === ProfileActivity.Communities}
          /> */}
          <CWTab
            label={
              <div className="tab-header">
                Addresses
                <div className="count">{addresses.length}</div>
              </div>
            }
            onClick={() => {
              setSelectedActivity(ProfileActivityType.Addresses);
            }}
            isSelected={selectedActivity === ProfileActivityType.Addresses}
          />
        </CWTabBar>
      </div>
      <div className="activity-content">
        <ProfileActivityContent
          option={selectedActivity}
          threads={threads}
          comments={comments}
          addresses={addresses}
        />
      </div>
    </div>
  );
};

export default ProfileActivity;
