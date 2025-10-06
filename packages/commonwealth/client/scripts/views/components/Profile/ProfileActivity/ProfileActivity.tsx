import React, { useState } from 'react';

import './ProfileActivity.scss';

import { useFlag } from 'client/scripts/hooks/useFlag';
import clsx from 'clsx';
import type Comment from 'models/Comment';
import type Thread from 'models/Thread';
import type { IUniqueId } from 'models/interfaces';
import useUserStore from 'state/ui/user';
import { CWTab, CWTabsRow } from '../../component_kit/new_designs/CWTabs';
import ProfileActivityContent, {
  ProfileActivityType,
} from './ProfileActivityContent';

export type CommentWithAssociatedThread = Comment<IUniqueId> & {
  thread: Thread;
};

type ProfileActivityProps = {
  comments: CommentWithAssociatedThread[];
  threads: Thread[];
  userId: number;
};

const ProfileActivity = ({
  comments,
  threads,
  userId,
}: ProfileActivityProps) => {
  const newProfilePageEnabled = useFlag('newProfilePage');
  const xpEnabled = useFlag('xp');

  const [selectedActivity, setSelectedActivity] = useState(
    ProfileActivityType.Comments,
  );
  const user = useUserStore();

  return (
    <div className="ProfileActivity">
      <div className="activity-nav">
        <CWTabsRow>
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
          <CWTab
            label="Comments"
            onClick={() => {
              setSelectedActivity(ProfileActivityType.Comments);
            }}
            isSelected={selectedActivity === ProfileActivityType.Comments}
          />
          <CWTab
            label="My Tokens"
            onClick={() => {
              setSelectedActivity(ProfileActivityType.MyTokens);
            }}
            isSelected={selectedActivity === ProfileActivityType.MyTokens}
          />
          {xpEnabled && (
            <CWTab
              label="Aura"
              onClick={() => {
                setSelectedActivity(ProfileActivityType.Aura);
              }}
              isSelected={selectedActivity === ProfileActivityType.Aura}
            />
          )}
          {newProfilePageEnabled && (
            <CWTab
              label={
                <div className="tab-header">
                  Communities
                  <div className="count">{user.communities.length}</div>
                </div>
              }
              onClick={() => {
                setSelectedActivity(ProfileActivityType.Communities);
              }}
              isSelected={selectedActivity === ProfileActivityType.Communities}
            />
          )}
        </CWTabsRow>
      </div>
      <div
        className={clsx(
          'activity-content',
          selectedActivity === ProfileActivityType.Comments ||
            selectedActivity === ProfileActivityType.Threads
            ? 'removePadding'
            : '',
          selectedActivity === ProfileActivityType.Communities
            ? 'communityPadding'
            : '',
        )}
      >
        <ProfileActivityContent
          option={selectedActivity}
          threads={threads}
          comments={comments}
          userId={userId}
        />
      </div>
    </div>
  );
};

export default ProfileActivity;
