/* @jsx m */
import 'pages/projects/index.scss';

import m from 'mithril';
import { CWText } from 'views/components/component_kit/cw_text';
import { Project } from 'models';
import app from 'state';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import ProjectCard, { ProjectCardSize } from './project_card';

export default class YourPage implements m.ClassComponent {
  // private supportedProjects: Project[];
  // private userProjects: Project[];

  private totalSupportedProjects = 0;
  private totalEndedProjects = 0;
  private supportedProjectsDisplayed = 6;
  private endedProjectsDisplayed = 6;

  getUserProjects(): Project[] {
    const allProjects: Project[] = [];
    app.user.addresses.forEach(({ address, chain }) => {
      app.projects.store
        .getAll()
        .filter((project) => project.isAuthor(address, chain))
        .forEach((project) => allProjects.push(project));
    });
    // TODO filter by current
    return allProjects;
  }

  getSupportedProjects(): Project[] {
    const allProjects: Project[] = [];
    app.user.addresses.forEach(({ address, chain }) => {
      app.projects.store
        .getAll()
        .filter(
          (project) =>
            project.isBacker(address, chain) ||
            project.isCurator(address, chain)
        )
        .forEach((project) => allProjects.push(project));
    });
    this.totalSupportedProjects = allProjects.length;
    // TODO filter by current
    return allProjects
      .sort((a, b) => a.createdAt.diff(b.createdAt))
      .slice(0, this.supportedProjectsDisplayed);
  }

  getEndedProjects() {
    const allProjects: Project[] = [];
    app.user.addresses.forEach(({ address, chain }) => {
      app.projects.store
        .getAll()
        .filter(
          (project) =>
            project.isBacker(address, chain) ||
            project.isCurator(address, chain)
        )
        .forEach((project) => allProjects.push(project));
    });
    this.totalEndedProjects = allProjects.length;
    return allProjects
      .sort((a, b) => a.createdAt.diff(b.createdAt))
      .slice(0, this.endedProjectsDisplayed);
    return [];
  }

  view() {
    if (!app.isLoggedIn()) {
      m.route.set(`/projects/explore`);
      return;
    }

    return (
      <div class="YourPage">
        <CWText type="h1">Your Projects</CWText>
        <div class="projects-listing">
          {this.getUserProjects().map((project) => (
            <ProjectCard project={project} size={ProjectCardSize.Large} />
          ))}
          <CWButton buttonType="secondary" label="Manage" />
        </div>
        <CWText type="h1">Backed and Curated</CWText>
        <div class="projects-wrap">
          <div class="projects-listing">
            {this.getSupportedProjects().map((project) => (
              <ProjectCard project={project} size={ProjectCardSize.Medium} />
            ))}
          </div>
          <CWButton
            label="Show More"
            buttonType="secondary"
            disable={
              this.supportedProjectsDisplayed >= this.totalSupportedProjects
            }
            onclick={() => {
              this.supportedProjectsDisplayed += 6;
              console.log(this.supportedProjectsDisplayed);
            }}
          />
        </div>
        <CWText type="h1">Ended Projects</CWText>
        <div class="projects-wrap">
          <div class="projects-listing">
            {this.getEndedProjects().map((project) => (
              <ProjectCard project={project} size={ProjectCardSize.Small} />
            ))}
          </div>
          <CWButton
            label="Show More"
            buttonType="secondary"
            disable={this.endedProjectsDisplayed >= this.totalEndedProjects}
            onclick={() => {
              this.endedProjectsDisplayed += 6;
              console.log(this.endedProjectsDisplayed);
            }}
          />
        </div>
      </div>
    );
  }
}
