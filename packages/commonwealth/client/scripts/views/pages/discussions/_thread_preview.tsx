/* @jsx m */

import m from 'mithril';

import 'pages/discussions/thread_preview.scss';

import { Thread } from 'models';

type ThreadPreviewAttrs = {
  thread: Thread;
};

export class _ThreadPreview implements m.ClassComponent<ThreadPreviewAttrs> {
  view(vnode: m.VnodeDOM<ThreadPreviewAttrs, this>) {
    const { thread } = vnode.attrs;

    return (
      <div class="ThreadPreview" key={thread.id}>
        stuff
      </div>
    );
  }
}
