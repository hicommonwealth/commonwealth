/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import Thread from 'client/scripts/models/Thread';
import Comment from 'client/scripts/models/Comment';
import { IUniqueId } from 'client/scripts/models/interfaces';
import { NewProfileActivityRow } from './new_profile_activity_row';

enum ProfileActivity {
  Addresses,
  Comments,
  Communities,
  Threads,
}

type CommentWithAssociatedThread = Comment<IUniqueId> & {
  thread: Thread;
}

type NewProfileActivityContentAttrs = {
  address: string;
  commentCharLimit: number;
  option: ProfileActivity;
  threadCharLimit: number;
  threads: Thread[];
  comments: CommentWithAssociatedThread[];
};

export class NewProfileActivityContent extends ClassComponent<NewProfileActivityContentAttrs> {
  private threads: Thread[];
  private comments: CommentWithAssociatedThread[];
  private hasReceivedParentAttrs: boolean;

  deleteActivityRow = (activity: CommentWithAssociatedThread | Thread) => {
    if ((activity as Thread).kind) {
      this.threads = this.threads.filter((t) => t.id !== activity.id);
    } else {
      this.comments = this.comments.filter((c) => c.id !== activity.id);
    }
    m.redraw();
  };

  view(vnode: m.Vnode<NewProfileActivityContentAttrs>) {
    const { option, commentCharLimit, threadCharLimit, address, comments, threads } =
      vnode.attrs;

    if (!threads.length && !comments.length && !this.hasReceivedParentAttrs) {
      return;
    }

    if (!this.hasReceivedParentAttrs) {
      this.threads = [...vnode.attrs.threads];
      this.comments = [...vnode.attrs.comments];
      this.hasReceivedParentAttrs = true;
      m.redraw();
    }

    if (option === ProfileActivity.Threads) {
      return this.threads.sort(((a, b) => +b.createdAt - +a.createdAt)).map((thread) => (
        <NewProfileActivityRow
          activity={thread}
          charLimit={threadCharLimit}
          address={address}
          deleteCallback={this.deleteActivityRow}
        />
      ));
    }

    const allActivities: Array<CommentWithAssociatedThread | Thread> = [...this.comments, ...this.threads].sort(
      (a, b) => +b.createdAt - +a.createdAt
    );

    return allActivities.map((activity) => {
      return (
        <NewProfileActivityRow
          activity={activity}
          charLimit={commentCharLimit}
          address={address}
          deleteCallback={this.deleteActivityRow}
        />
      );
    });
  }
}
