/* @jsx m */

import m from 'mithril';

import 'pages/discussions/recent_threads.scss';

import app from 'state';
import { isNotUndefined } from 'helpers/typeGuards';
import { pluralize } from 'helpers';
import { ThreadPreview } from './thread_preview';
import { CWText } from '../../components/component_kit/cw_text';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CreateContentPopover } from '../../menus/create_content_menu';
import { _ThreadPreview } from './_thread_preview';

interface RecentThreadsAttrs {
  stageName: string;
  topicName: string;
}
export class RecentThreads implements m.ClassComponent<RecentThreadsAttrs> {
  private initializing: boolean;

  view(vnode: m.VnodeDOM<RecentThreadsAttrs, this>) {
    const { topicName, stageName } = vnode.attrs;

    const { listingStore } = app.threads;

    // Fetch first 20 unpinned threads
    if (
      !listingStore.isInitialized({
        topicName,
        stageName,
      })
    ) {
      this.initializing = true;
      app.threads.loadNextPage({ topicName, stageName }).then(() => {
        this.initializing = false;
        m.redraw();
      });
    }

    const pinnedThreads = listingStore.getThreads({
      topicName,
      stageName,
      pinned: true,
    });

    const unpinnedThreads = listingStore.getThreads({
      topicName,
      stageName,
      pinned: false,
    });

    const totalThreadCount = pinnedThreads.length + unpinnedThreads.length;

    if (!totalThreadCount) {
      return (
        <div class="NoThreadsPlaceholder">
          {isNotUndefined(topicName) ? (
            <CWText className="no-threads-text">
              There are no threads matching your filter.
            </CWText>
          ) : (
            <>
              <div class="icon-circle">
                <CWIcon iconName="hash" iconSize="large" />
              </div>
              <div class="welcome-text-container">
                <CWText type="h3">Welcome to the community!</CWText>
                <CWText className="no-threads-text">
                  There are no threads here yet.
                </CWText>
              </div>
              <CreateContentPopover />
            </>
          )}
        </div>
      );
    }

    const subpage = topicName || stageName;

    return (
      <div class="RecentThreads">
        {this.initializing ? (
          <CWSpinner />
        ) : (
          <>
            {pinnedThreads.map((t) => (
              <_ThreadPreview thread={t} />
            ))}
            {unpinnedThreads.map((t) => (
              <_ThreadPreview thread={t} />
            ))}
            <div class="listing-scroll">
              {listingStore.isDepleted({ topicName, stageName }) ? (
                <CWText className="thread-count-text">
                  {`Showing ${totalThreadCount} of ${pluralize(
                    totalThreadCount,
                    'thread'
                  )}${subpage ? ` under the subpage '${subpage}'` : ''}`}
                </CWText>
              ) : (
                <CWSpinner size="large" />
              )}
            </div>
          </>
        )}
      </div>
    );
  }
}
