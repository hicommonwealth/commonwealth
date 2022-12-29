/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
import { debounce } from 'lodash';

import 'pages/discussions/index.scss';

import app from 'state';
import { pluralize } from 'helpers';
import { isNotUndefined } from 'helpers/typeGuards';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';
import { RecentThreadsHeader } from './recent_threads_header';
import { CWText } from '../../components/component_kit/cw_text';
import { ThreadPreview } from './thread_preview';

type DiscussionPageAttrs = { topic?: string };

// Graham 4/18/22 Todo: Consider re-implementing LastVisited logic
class DiscussionsPage extends ClassComponent<DiscussionPageAttrs> {
  private fetchingThreads: boolean;
  private initializing: boolean;
  private stageName: string;
  private topicName: string;

  get scrollEle() {
    return document.getElementsByClassName('Body')[0];
  }

  async onScroll() {
    localStorage[`${app.activeChainId()}-discussions-scrollY`] =
      this.scrollEle.scrollTop;

    const { fetchingThreads, topicName, stageName } = this;

    if (
      !fetchingThreads &&
      !app.threads.listingStore.isDepleted({
        topicName,
        stageName,
      }) &&
      !(this.scrollEle.scrollHeight - 1000 >= this.scrollEle.scrollTop)
    ) {
      this.fetchingThreads = true;
      await app.threads.loadNextPage({ topicName, stageName });
      this.fetchingThreads = false;
      redraw();
    }
  }

  oncreate() {
    const storedScrollYPos =
      localStorage[`${app.activeChainId()}-discussions-scrollY`];

    if (app.lastNavigatedBack() && storedScrollYPos) {
      setTimeout(() => {
        this.scrollEle.scrollTo(0, Number(storedScrollYPos));
      }, 100);
    }
  }

  view(vnode: ResultNode<DiscussionPageAttrs>) {
    if (!app.chain || !app.chain.serverLoaded) {
      return <PageLoading />;
    }

    this.topicName = vnode.attrs.topic;
    this.stageName = getRouteParam('stage');

    const { topicName, stageName } = this;

    // Fetch first 20 unpinned threads
    if (
      !app.threads.listingStore.isInitialized({
        topicName,
        stageName,
      })
    ) {
      this.initializing = true;
      app.threads.loadNextPage({ topicName, stageName }).then(() => {
        this.initializing = false;
        redraw();
      });
    }

    const pinnedThreads = app.threads.listingStore.getThreads({
      topicName,
      stageName,
      pinned: true,
    });

    const unpinnedThreads = app.threads.listingStore.getThreads({
      topicName,
      stageName,
      pinned: false,
    });

    const totalThreadCount = pinnedThreads.length + unpinnedThreads.length;

    const subpage = topicName || stageName;

    return this.initializing ? (
      <PageLoading />
    ) : (
      <Sublayout
        title="Discussions"
        description={
          app.topics.getByName(this.topicName, app.activeChainId()) || ''
        }
        onScroll={debounce(this.onScroll.bind(this), 400)}
      >
        <div className="DiscussionsPage">
          <RecentThreadsHeader
            topic={this.topicName}
            stage={this.stageName}
            totalThreadCount={totalThreadCount}
          />
          {totalThreadCount > 0 ? (
            <div className="RecentThreads">
              {pinnedThreads.map((t) => (
                <ThreadPreview thread={t} />
              ))}
              {unpinnedThreads.map((t) => (
                <ThreadPreview thread={t} />
              ))}
              {app.threads.listingStore.isDepleted({
                topicName,
                stageName,
              }) && (
                <div className="listing-scroll">
                  <CWText className="thread-count-text">
                    {`Showing ${totalThreadCount} of ${pluralize(
                      totalThreadCount,
                      'thread'
                    )}${subpage ? ` under the subpage '${subpage}'` : ''}`}
                  </CWText>
                </div>
              )}
            </div>
          ) : (
            <CWText className="no-threads-text">
              {isNotUndefined(topicName)
                ? 'There are no threads matching your filter.'
                : 'There are no threads here yet.'}
            </CWText>
          )}
        </div>
      </Sublayout>
    );
  }
}

export default DiscussionsPage;
