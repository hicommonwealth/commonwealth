/* @jsx m */

import 'pages/projects/project_card.scss';

import m from 'mithril';
import { capitalize } from 'lodash';
import { slugify } from 'utils';
import moment from 'moment';
import { CWText } from 'views/components/component_kit/cw_text';
import { AnonymousUser } from 'views/components/widgets/user';
import { Project } from 'models';

class DummyChainIcon
  implements m.ClassComponent<{ chain; onclick; size: number }>
{
  view(vnode) {
    const iconUrl = 'https://commonwealth.im/static/img/protocols/edg.png';
    const size = vnode.attrs.size;
    return (
      <div class="DummyChainIcon">
        <img
          class="chain-icon"
          style={`width: ${size}px; height: ${size}px;`}
          src={iconUrl}
          onclick={onclick}
        />
      </div>
    );
  }
}

class ProjectHeaderPanel
  implements
    m.ClassComponent<{
      iconSize?: number;
      coverImage: string;
    }>
{
  view(vnode) {
    const iconSize = vnode.attrs.iconSize || 32;
    const { coverImage } = vnode.attrs;
    return (
      <div
        class="ProjectHeaderPanel"
        style={`background-image: url("${coverImage}");`}
      >
        {iconSize && (
          <DummyChainIcon chain={null} onclick={null} size={iconSize} />
        )}
      </div>
    );
  }
}

export class ProjectCompletionBar
  implements m.ClassComponent<{ completionPercent: number }>
{
  view(vnode) {
    const { completionPercent } = vnode.attrs;
    return (
      <div class="ProjectCompletionBar">
        <div
          class="completed-percentage"
          style={`width: ${completionPercent * 400}px`}
        />
      </div>
    );
  }
}

class ProjectInfoPanel
  implements
    m.ClassComponent<{
      project;
      avatarSize: number;
      iconSize?: number;
    }>
{
  view(vnode) {
    const { project, avatarSize, iconSize } = vnode.attrs;
    return (
      <div class="ProjectInfoPanel">
        <div class="project-info-header">
          {iconSize && (
            <DummyChainIcon chain={null} onclick={null} size={iconSize} />
          )}
          <CWText type="h5">{project.title}</CWText>
        </div>
        <div class="project-deadline-wrap">
          <CWText type="caption" fontWeight="medium">
            <div class="project-deadline">
              {`${(project.deadline.asDate as moment.Moment).toNow(
                true
              )} remaining`}
            </div>
          </CWText>
        </div>
        <div class="project-info-body">
          <CWText type="caption">
            {project.shortDescription || project.description}
          </CWText>
        </div>
        <div class="project-info-footer">
          {m(AnonymousUser, {
            avatarSize,
            distinguishingKey: '123',
          })}
        </div>
      </div>
    );
  }
}

export enum ProjectCardSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

interface ProjectCardAttrs {
  project: Project;
  size: ProjectCardSize;
}

export default class ProjectCard implements m.ClassComponent<ProjectCardAttrs> {
  view(vnode) {
    const { project, size } = vnode.attrs;

    const projectStatus =
      project.raised.inTokens > project.threshold.inTokens
        ? 'succeeded'
        : 'failed';

    const onclick = () => {
      console.log(`project/${project.id}-${slugify(project.title)}`);
      m.route.set(`project/${project.id}-${slugify(project.title)}`);
    };

    const ProjectCardLarge = (
      <div class="ProjectCard large" onclick={onclick}>
        <ProjectHeaderPanel iconSize={32} coverImage={project.coverImage} />
        <ProjectCompletionBar completionPercent={project.progress.asPercent} />
        <ProjectInfoPanel project={project} avatarSize={16} />
      </div>
    );

    const ProjectCardMedium = (
      <div class="ProjectCard medium" onclick={onclick}>
        <ProjectHeaderPanel />
        <ProjectCompletionBar completionPercent={project.progress.asPercent} />
        <ProjectInfoPanel project={project} avatarSize={16} iconSize={24} />
      </div>
    );

    const ProjectCardSmall = (
      <div class="ProjectCard small" onclick={onclick}>
        <div class="top-panel">
          <CWText type="h3">{project.title}</CWText>
          {/* TODO: Implement label in kit */}
        </div>
        <div class={`.project-status.${projectStatus}`}>
          {capitalize(projectStatus)}
        </div>
        <div class="bottom-panel">
          <DummyChainIcon chain={null} onclick={null} size={12} />
          <div class="project-token-name">{project.token}</div>
        </div>
      </div>
    );

    switch (size) {
      case ProjectCardSize.Large:
        return ProjectCardLarge;
      case ProjectCardSize.Medium:
        return ProjectCardMedium;
      case ProjectCardSize.Small:
        return ProjectCardSmall;
      default:
    }
  }
}
