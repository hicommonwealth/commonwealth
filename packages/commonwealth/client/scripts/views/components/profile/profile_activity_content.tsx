import React from 'react';

import type Thread from 'client/scripts/models/Thread';
import NewProfileActivityRow from './profile_activity_row';
import type { CommentWithAssociatedThread } from './profile_activity';

enum ProfileActivityType {
  Addresses,
  Comments,
  Communities,
  Threads,
}

type ProfileActivityContentProps = {
  option: ProfileActivityType;
  threads: Thread[];
  comments: CommentWithAssociatedThread[];
};

const ProfileActivityContent = (props: ProfileActivityContentProps) => {
  const { option, comments, threads } = props;

  if (option === ProfileActivityType.Threads) {
    return threads
      .sort((a, b) => +b.createdAt - +a.createdAt)
      .map((thread, i) => (
        <NewProfileActivityRow key={i} activity={thread} />
      ));
  }

  const allActivities: Array<CommentWithAssociatedThread | Thread> = [
    ...comments,
    ...threads,
  ].sort((a, b) => +b.createdAt - +a.createdAt);

  return allActivities.map((activity, i) => {
    return <NewProfileActivityRow key={i} activity={activity} />;
  });
}

export default ProfileActivityContent;
