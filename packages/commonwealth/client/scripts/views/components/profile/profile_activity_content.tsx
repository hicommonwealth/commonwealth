import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';

import type Thread from 'client/scripts/models/Thread';
import NewProfileActivityRow from './profile_activity_row';
import type { CommentWithAssociatedThread } from './profile_activity';

enum ProfileActivityType {
  Addresses,
  Comments,
  Communities,
  Threads,
}

type ProfileActivityContentAttrs = {
  address: string;
  option: ProfileActivityType;
  threads: Thread[];
  comments: CommentWithAssociatedThread[];
};

class ProfileActivityContent extends ClassComponent<ProfileActivityContentAttrs> {
  view(vnode: ResultNode<ProfileActivityContentAttrs>) {
    const { option, address, comments, threads } = vnode.attrs;

    if (option === ProfileActivityType.Threads) {
      return threads
        .sort((a, b) => +b.createdAt - +a.createdAt)
        .map((thread, i) => (
          <NewProfileActivityRow key={i} activity={thread} address={address} />
        ));
    }

    const allActivities: Array<CommentWithAssociatedThread | Thread> = [
      ...comments,
      ...threads,
    ].sort((a, b) => +b.createdAt - +a.createdAt);

    return allActivities.map((activity, i) => {
      return (
        <NewProfileActivityRow key={i} activity={activity} address={address} />
      );
    });
  }
}

export default ProfileActivityContent;
