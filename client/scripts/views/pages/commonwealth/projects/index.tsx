/* @jsx m */
import 'pages/projects/index.scss';

import m from 'mithril';
import app from 'state';
import { AddressInfo } from 'models';
import {
  CWBacker,
  CWCurator,
} from 'controllers/chain/ethereum/commonwealth/participants';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import Sublayout from '../../../sublayout';
import { DummyProject } from './dummy_project';
import ExploreProjectsPage from './explore';
import BackedProjectsPage from './backed';
import YourProjectsPage from './your_projects';

type ProjectProgress = {
  inBlocks: number;
  asPercent: number;
};

type ProjectDeadline = {
  inBlocks: number;
  asDate: moment.Moment;
};

type ProjectFunds = {
  inTokens: number;
  inDollars: number;
};

interface ICreateProjectForm {
  name: string;
  token: string;
  threshold: number;
  fundraiseLength: number;
  beneficiary: string;
  shortDescription: string;
  description: string;
}

// TODO: Reconcile against Jake's controller classes
export type Project = {
  id: number;
  chain: string;
  title: string;
  description: string;
  shortDescription?: string;
  coverImage: string;
  token: any;
  creator: AddressInfo;
  beneficiary: AddressInfo;
  backers: CWBacker[];
  curatorCut: number;
  curators: CWCurator[];
  createdAt: moment.Moment;
  progress: ProjectProgress;
  deadline: ProjectDeadline;
  threshold: ProjectFunds;
  raised: ProjectFunds;
};

enum ProjectListingSubpage {
  Yours = 'yours',
  Explore = 'explore',
  Backed = 'backed',
}

export default class ProjectListing
  implements m.ClassComponent<{ form: ICreateProjectForm }>
{
  private projects: any; // Project[];
  private subpage: ProjectListingSubpage;

  getExploreProjects(): Project[] {
    // TODO: filter this.projects
    return Array(6).fill(DummyProject);
  }

  getYourProjects(): Project[] {
    // TODO: filter this.projects
    return Array(6).fill(DummyProject);
  }

  getBackedProjects(): Project[] {
    // TODO: filter this.projects
    return Array(6).fill(DummyProject);
  }

  getProjectListingSubpage() {
    if (this.subpage === ProjectListingSubpage.Yours) {
      return <YourProjectsPage projects={this.getYourProjects()} />;
    } else if (this.subpage === ProjectListingSubpage.Backed) {
      return <BackedProjectsPage projects={this.getBackedProjects()} />;
    } else {
      return <ExploreProjectsPage projects={this.getExploreProjects()} />;
    }
  }

  view(vnode) {
    this.subpage = vnode.attrs.subpage;

    // TODO: Reconcile local project type against controller class
    this.projects = app.activeChainId()
      ? app.projects.store
          .getAll()
          .filter((project) => project.token === app.activeChainId())
      : app.projects.store.getAll();

    return (
      <Sublayout
        title={<CWIcon iconName="common" />}
        hideSearch={true}
        hideSidebar={true}
        showNewProposalButton={false}
        alwaysShowTitle={true}
      >
        {/* TODO: Move towards simple tabs & URI-based toggling between various subpage */}
        <div class="ProjectsListing">{this.getProjectListingSubpage()}</div>
        {/* <div class="CreateProjectForm">
          <CWTextInput
            label="Name"
            name="Name"
            oninput={(e) => {
              vnode.state.form.name = e.target.value;
            }}
          />
          <CWTextInput
            label="Raise In"
            name="Raise In"
            oninput={(e) => {
              vnode.state.form.token = e.target.value;
            }}
          />
          ,
          <CWTextInput
            label="Minimum Raise"
            name="Minimum Raise"
            oninput={(e) => {
              vnode.state.form.threshold = Number(e.target.value);
            }}
          />
          ,
          <CWTextInput
            label="Fundraise Length"
            name="Fundraise Length"
            oninput={(e) => {
              vnode.state.form.fundraiseLength = e.target.value;
            }}
          />
          ,
          <CWTextInput
            label="Beneficiary Address"
            name="Beneficiary Address"
            oninput={(e) => {
              vnode.state.form.beneficiary = e.target.value;
            }}
          />
          ,
          <CWTextInput
            label="Summary"
            name="Summary"
            oninput={(e) => {
              vnode.state.form.shortDescription = e.target.value;
            }}
          />
          ,
          <CWTextInput
            label="Description"
            name="Description"
            oninput={(e) => {
              vnode.state.form.description = e.target.value;
            }}
          />
          ,
        </div> */}
      </Sublayout>
    );
  }
}
