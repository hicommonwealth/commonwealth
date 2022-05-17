/* @jsx m */
import 'pages/projects/index.scss';

import m from 'mithril';
import app from 'state';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { TabItem, Tabs } from 'construct-ui';
import { CWText } from 'views/components/component_kit/cw_text';
import { Project } from 'client/scripts/models';
import Sublayout from '../../../sublayout';
import ExploreProjectsPage from './explore';
import BackedProjectsPage from './backed';
import YourProjectsPage from './your_projects';

enum ProjectListingSubpage {
  Yours = 'yours',
  Explore = 'explore',
  Backed = 'backed',
}

export default class ProjectListing implements m.ClassComponent {
  private projects: Project[];
  private subpage: ProjectListingSubpage;

  private _getExploreProjects(): Project[] {
    return (
      app.projects.store
        .getAll()
        // TODO: Better momentjs-native sorting
        .sort((a, b) => (a.deadline.isBefore(b.deadline) ? -1 : 1))
    );
  }

  private _getYourProjects(): Project[] {
    const { chain, address } = app.user.activeAccount;
    return app.projects.store
      .getAll()
      .filter(
        (project) => project.address === address && project.chainId === chain.id
      );
  }

  private _getBackedProjects(): Project[] {
    return app.projects.store
      .getAll()
      .filter((project) =>
        project.isBacker(
          app.user.activeAccount.address,
          app.user.activeAccount.chain.id
        )
      );
  }

  private _displaySubpage() {
    if (this.subpage === ProjectListingSubpage.Yours) {
      return <YourProjectsPage projects={this._getYourProjects()} />;
    } else if (this.subpage === ProjectListingSubpage.Backed) {
      return <BackedProjectsPage projects={this._getBackedProjects()} />;
    } else {
      return <ExploreProjectsPage projects={this._getExploreProjects()} />;
    }
  }

  view(vnode) {
    this.subpage = vnode.attrs.subpage || ProjectListingSubpage.Explore;
    this.projects = app.projects.store.getAll();

    return (
      <Sublayout
        title={<CWIcon iconName="common" />}
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
                active={this.subpage === ProjectListingSubpage.Explore}
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
                active={this.subpage === ProjectListingSubpage.Yours}
                onclick={() => {
                  m.route.set(`/projects/${ProjectListingSubpage.Yours}`);
                  m.redraw();
                }}
              />
              <TabItem
                label={[
                  <CWText type="h3" fontWeight="semibold">
                    Backing
                  </CWText>,
                ]}
                active={this.subpage === ProjectListingSubpage.Backed}
                onclick={() => {
                  m.route.set(`/projects/${ProjectListingSubpage.Backed}`);
                  m.redraw();
                }}
              />
            </Tabs>
          </div>
          <div class="listing-body">{this._displaySubpage()}</div>
        </div>
      </Sublayout>
    );
  }
}
