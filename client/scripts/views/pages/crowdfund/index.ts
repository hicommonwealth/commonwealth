import 'pages/crowdfund/index.scss';

import m from 'mithril';
import SearchBar from '../../components/search_bar';
import { ButtonIntent, FaceliftButton } from '../../components/component_kit/buttons';
// import CrowdfundCard, { CrowdfundCardSize } from './crowdfund_card';

interface ProjectListingAttrs {
  project; // : Project;
}

interface ProjectListingState {
}

const ProjectListing: m.Component<ProjectListingAttrs, ProjectListingState> = {
  view: (vnode) => {
    // userCreatedProjects: Project[] = projects.filter(...);
    // userBackedProjects: Project[] = projects.filter(...);
    // userPreviouslyBackedProjects: Project[] = projects.filter(...);
    // trendingCommunityProjects: Project[] = projects.filter(...);
    // recommendedCommunityProjects: Project[] = projects.filter(...);
    return m('.ProjectListing', [
      // (userCreatedProjects || userBackedProjects || userPreviouslyBackedProjects) &&
      m('.user-projects', [
        // userCreatedProjects.length &&
        m('.user-created-project-wrap', [
          m('h1', 'Your Projects'),
          m(FaceliftButton, {
            intent: ButtonIntent.Primary,
            label: 'Create New Project',
            onclick: () => true, // app.projects.createProject()
          }),
          // m('.user-created-projects', userCreatedProjects.map((project) => {
          //      m(CrowdfundCard, { project, size: CrowdfundCardSize.Large })
          //  })
          // ),
        ]),
        m('.user-backed-project-wrap', [
          m('h2', 'Currently Backing'),
          // m('.user-backed-projects', userBackedProjects.map((project) => {
          //      m(CrowdfundCard, { project, size: CrowdfundCardSize.Medium })
          //  })
          // ),
        ]),
        m('.user-previously-backed-project-wrap', [
          m('h3', 'Past Contributions'),
          // m('.user-previously-backed-projects', userPreviouslyBackedProjects.map((project) => {
          //      m(CrowdfundCard, { project, size: CrowdfundCardSize.Small })
          //  })
          // ),
        ])
      ]),
      // communityHasProjects &&
      m('.community-projects', [
        m('h1', 'Discover'),
        m('.project-discovery', [
          m('h2', 'Trending'),
          // m('.trending-projects', trendingProjects.map((project) => {
          //      m(CrowdfundCard, { project, size: CrowdfundCardSize.Large })
          //  })
          // ),
          m('h2', 'Recommended')
          // m('.recommended-projects', recommendedProjects.map((project) => {
          //      m(CrowdfundCard, { project, size: CrowdfundCardSize.Medium })
          //  })
          // ),
        ]),
        // TODO: ModularizeSearch
        m(SearchBar)
      ])
    ])
  }
}

export default ProjectListing;