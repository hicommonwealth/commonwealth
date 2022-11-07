/* @jsx m */

import m from 'mithril';

import 'pages/discussions/recent_listing.scss';

import app from 'state';
import { isNotUndefined } from 'helpers/typeGuards';
import { pluralize } from 'helpers';
import { DiscussionRow } from './discussion_row';
import { CWText } from '../../components/component_kit/cw_text';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CreateContentPopover } from '../../menus/create_content_menu';

interface RecentListingAttrs {
  stageName: string;
  topicName: string;
}
export class RecentListing implements m.ClassComponent<RecentListingAttrs> {
  private initializing: boolean;

  view(vnode: m.VnodeDOM<RecentListingAttrs, this>) {
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
        <div class="EmptyListingPlaceholder">
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
      <div class="RecentListing">
        {this.initializing ? (
          <CWSpinner />
        ) : (
          <>
            {pinnedThreads.map((t) => (
              <DiscussionRow thread={t} />
            ))}
            {unpinnedThreads.map((t) => (
              <DiscussionRow thread={t} />
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
