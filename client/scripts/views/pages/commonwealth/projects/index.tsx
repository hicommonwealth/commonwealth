/* @jsx m */
import 'pages/projects/index.scss';

import m from 'mithril';
import app from 'state';
import { TabItem, Tabs } from 'construct-ui';
import { CWText } from 'views/components/component_kit/cw_text';
import { notifyInfo } from 'controllers/app/notifications';
import Sublayout from '../../../sublayout';
import ExplorePage from './explore_page';
import YourPage from './your_page';
import { CommonLogo } from './common_logo';

enum ProjectListingSubpage {
  Explore = 'explore',
  Yours = 'yours',
}

export default class ProjectListing implements m.ClassComponent {
  private subpage: ProjectListingSubpage;

  view(vnode) {
    const { subpage } = vnode.attrs;
    if (!app) return;
    const onExplore = subpage !== ProjectListingSubpage.Yours;
    if (!app.isLoggedIn() && !onExplore) {
      console.log(app.user);
      m.route.set('/projects/explore');
    }
    return (
      <Sublayout
        title={<CommonLogo />}
        hideSearch={true}
        hideSidebar={true}
        showNewProposalButton={false}
        alwaysShowTitle={true}
      >
        <div class="ProjectListing">
          <div class="listing-header">
            <Tabs align="left" bordered={false} fluid={true}>
              <TabItem
                label={[
                  <CWText type="h3" fontWeight="semibold">
                    Explore
                  </CWText>,
                ]}
                active={subpage === ProjectListingSubpage.Explore}
                onclick={() => {
                  m.route.set(`/projects/${ProjectListingSubpage.Explore}`);
                  m.redraw();
                }}
              />
              <TabItem
                label={[
                  <CWText type="h3" fontWeight="semibold">
                    Your Projects
                  </CWText>,
                ]}
                active={subpage === ProjectListingSubpage.Yours}
                onclick={() => {
                  if (!app.user) {
                    notifyInfo(
                      'Log in or create an account for user dashboard.'
                    );
                  }
                  m.route.set(`/projects/${ProjectListingSubpage.Yours}`);
                  m.redraw();
                }}
              />
            </Tabs>
          </div>
          <div class="listing-body">
            {onExplore && <ExplorePage />}
            {!onExplore && <YourPage />}
          </div>
        </div>
      </Sublayout>
    );
  }
}
