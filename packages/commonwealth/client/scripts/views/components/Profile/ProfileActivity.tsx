import React, { useState } from 'react';

import 'components/Profile/ProfileActivity.scss';

import type Thread from 'models/Thread';
import type Comment from 'models/Comment';
import type AddressInfo from 'models/AddressInfo';
import type { IUniqueId } from 'models/interfaces';
import { CWTab, CWTabsRow } from '../component_kit/new_designs/CWTabs';
import ProfileActivityContent from './ProfileActivityContent';

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

const ProfileActivity = ({ comments, threads }: ProfileActivityProps) => {
  const [selectedActivity, setSelectedActivity] = useState(
    ProfileActivityType.Comments
  );

  return (
    <div className="ProfileActivity">
      <div className="activity-nav">
        <CWTabsRow>
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
        </CWTabsRow>
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
