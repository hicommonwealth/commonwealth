/* @jsx m */

import 'pages/projects/project_card.scss';

import m from 'mithril';
import { capitalize } from 'lodash';
import { slugify } from 'utils';
import moment from 'moment';
import { CWText } from 'views/components/component_kit/cw_text';
import { AnonymousUser } from 'views/components/widgets/user';
import { Project } from 'models';
import { Tag } from 'construct-ui';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

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

interface ProjectInfoAttrs {
  project: Project;
  avatarSize: number;
}
class ProjectInfoPanel implements m.ClassComponent<ProjectInfoAttrs> {
  view(vnode: m.Vnode<ProjectInfoAttrs>) {
    const { project, avatarSize } = vnode.attrs;
    // 40px tall funding data, 100px description, 40px recipient data
    // <tag with left-icon clock> <funding amount eth h5 bold and regular>
    // caption regular
    console.log(project.deadline);
    return (
      <div class="ProjectInfoPanel">
        <div class="project-funding-data">
          <Tag
            label={
              <>
                <CWIcon iconName="clock" size="small" />
                <CWText type="caption" fontWeight="medium">
                  <div class="project-deadline">
                    {`${project.deadline.fromNow(true)}`}
                  </div>
                </CWText>
              </>
            }
          />
          <CWText type="h5" fontWeight="bold">
            {project.fundingAmount.toNumber()} ETH
          </CWText>
          <CWText type="h5">of {project.threshold.toNumber()} ETH</CWText>
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
  view(vnode: m.Vnode<ProjectCardAttrs>) {
    const { project, size } = vnode.attrs;
    console.log(project);

    const projectStatus = project.fundingAmount.gt(project.threshold)
      ? 'succeeded'
      : 'failed';

    const onclick = () => {
      console.log(`project/${project.id}-${slugify(project.title)}`);
      m.route.set(`project/${project.id}-${slugify(project.title)}`);
    };

    // const ProjectCardMedium = (
    //   <div class="ProjectCard medium" onclick={onclick}>
    //     <ProjectHeaderPanel />
    //     <ProjectCompletionBar completionPercent={project.completionPercent} />
    //     <ProjectInfoPanel project={project} avatarSize={16} iconSize={24} />
    //   </div>
    // );

    // const ProjectCardSmall = (
    //   <div class="ProjectCard small" onclick={onclick}>
    //     <div class="top-panel">
    //       <CWText type="h3">{project.title}</CWText>
    //       {/* TODO: Implement label in kit */}
    //     </div>
    //     <div class={`.project-status.${projectStatus}`}>
    //       {capitalize(projectStatus)}
    //     </div>
    //     <div class="bottom-panel">
    //       <DummyChainIcon chain={null} onclick={null} size={12} />
    //       <div class="project-token-name">{project.token}</div>
    //     </div>
    //   </div>
    // );

    return (
      <div class="ProjectCard large" onclick={onclick}>
        <ProjectHeaderPanel iconSize={32} coverImage={project.coverImage} />
        <ProjectCompletionBar completionPercent={project.completionPercent} />
        <ProjectInfoPanel project={project} avatarSize={16} />
      </div>
    );
  }
}
