/* @jsx m */
import 'pages/projects/index.scss';

import m from 'mithril';
import app from 'state';
import { TabItem, Tabs } from 'construct-ui';
import { CWText } from 'views/components/component_kit/cw_text';
import { notifyInfo } from 'controllers/app/notifications';
import { CWButton } from 'views/components/component_kit/cw_button';
import Sublayout from '../../../sublayout';
import ExplorePage from './explore_page';
import YourPage from './your_page';
import { CommonLogo } from './common_logo';
import CreateProjectForm from './create_project_form';

enum ProjectListingSubpage {
  Create = 'create',
  Explore = 'explore',
  Yours = 'yours',
}

export default class ProjectListing implements m.ClassComponent {
  private subpage: ProjectListingSubpage;

  view(vnode) {
    const { subpage } = vnode.attrs;
    if (!app) return;
    console.log(subpage);
    const onExplore = subpage !== ProjectListingSubpage.Yours;
    if (!app.isLoggedIn() && !onExplore) {
      m.route.set('/projects/explore');
    } else if (subpage === ProjectListingSubpage.Create) {
      return (
        <Sublayout
          title={<CommonLogo />}
          hideSearch={true}
          hideSidebar={true}
          showNewProposalButton={false}
          alwaysShowTitle={true}
        >
          <CreateProjectForm />
        </Sublayout>
      );
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
            {/* TODO:
                  - Add chain community selector list, based on user role lookup
                  - Redirect to a scoped creation form
                  - Do not allow non-scoped creation forms (e.g. in routes, views)
                  - Set address by default, based on highest-power role
                  - Display this role address hard-coded (disabled input) in form next to beneficiary input
                  - Add copy explaining to user how to change creator address
                    - e.g. “Want a diff address? Switch active addr in nav bar dropdown”
                  - Potentially add summary modal pre-TX submission
             */}
            <CWButton
              onclick={(e) => m.route.set(`/projects/create`)}
              label="Create Project"
            />
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
