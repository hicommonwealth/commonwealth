import type AddressInfo from 'client/scripts/models/AddressInfo';
import type { IUniqueId } from 'client/scripts/models/interfaces';

import type Thread from 'client/scripts/models/Thread';

import 'components/profile/profile_activity.scss';
import React, { useState } from 'react';
import type CommentModel from '../../../models/CommentModel';
import { CWTab, CWTabBar } from '../component_kit/cw_tabs';
import ProfileActivityContent from './profile_activity_content';

enum ProfileActivityType {
  Addresses,
  Comments,
  Communities,
  Threads,
}

export type CommentWithAssociatedThread = CommentModel<IUniqueId> & {
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
  const { comments, threads } = props;

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
          option={selectedActivity}
          threads={threads}
          comments={comments}
        />
      </div>
    </div>
  );
};

export default ProfileActivity;
