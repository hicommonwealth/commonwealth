import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';

import type Thread from 'client/scripts/models/Thread';
import type { ChainInfo } from 'client/scripts/models';
import NewProfileActivityRow from './new_profile_activity_row';
import type { CommentWithAssociatedThread } from './new_profile_activity';

enum ProfileActivity {
  Addresses,
  Comments,
  Communities,
  Threads,
}

type NewProfileActivityContentAttrs = {
  address: string;
  option: ProfileActivity;
  threads: Thread[];
  comments: CommentWithAssociatedThread[];
  chains: ChainInfo[];
};

class NewProfileActivityContent extends ClassComponent<NewProfileActivityContentAttrs> {
  view(vnode: ResultNode<NewProfileActivityContentAttrs>) {
    const { option, address, comments, threads, chains } = vnode.attrs;

    if (option === ProfileActivity.Threads) {
      return threads
        .sort((a, b) => +b.createdAt - +a.createdAt)
        .map((thread, i) => (
          <NewProfileActivityRow
            key={i}
            activity={thread}
            address={address}
            chains={chains}
          />
        ));
    }

    const allActivities: Array<CommentWithAssociatedThread | Thread> = [
      ...comments,
      ...threads,
    ].sort((a, b) => +b.createdAt - +a.createdAt);

    return allActivities.map((activity, i) => {
      return (
        <NewProfileActivityRow
          key={i}
          activity={activity}
          address={address}
          chains={chains}
        />
      );
    });
  }
}

export default NewProfileActivityContent;
