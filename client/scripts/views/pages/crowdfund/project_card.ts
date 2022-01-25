import 'components/crowdfund/project_card.scss';

import m from 'mithril';
import { AnonymousUser } from '../../components/widgets/user';

export enum ProjectCardSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large'
}

interface ProjectCardAttrs {
  project; // : Project;
  size: ProjectCardSize;
}

interface ProjectCardState {
}

enum DummyProjectData {
  ProjectTitle = 'Project Name',
  ProjectDescription = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '
    + 'Sit ullamcorper tortor pretium amet eget leo. Venenatis id risus at mollis '
    + 'orci sapien integer id non eget.',
  ProjectBlockCount = '16K',
  ProjectChain = 'Ethereum',
  ProjectCompletionPercent = 0.32,
}

const DummyChainIcon: m.Component<{ chain, onclick, size: number }> = {
  view: (vnode) => {
    const iconUrl = 'https://commonwealth.im/static/img/protocols/edg.png'
    const size = vnode.attrs.size;
    return m('.ChainIcon', { class: onclick ? 'onclick' : '' }, [
      m('img.chain-icon', {
        style: `width: ${size}px; height: ${size}px;`,
        src: iconUrl,
        onclick
      })
    ]);
  }
};

const ProjectHeaderPanel: m.Component<{ iconSize?: number }> = {
  view: (vnode) => {
    const { iconSize } = vnode.attrs;
    return m('.ProjectHeaderPanel', [
      iconSize && m(DummyChainIcon, {
        chain: null,
        onclick: null,
        size: iconSize
      })
    ]);
  }
}

const ProjectCompletionBar: m.Component<{ completionPercent: number }> = {
  view: (vnode) => {
    const { completionPercent } = vnode.attrs;
    return m('.ProjectCompletionBar', [
      m('.completed-percentage', {
        style: `width: ${completionPercent * 400}px`
      }),
    ]);
  }
}

const ProjectInfoPanel: m.Component<{ project, avatarSize: number, iconSize?: number }> = {
  view: (vnode) => {
    const { project, avatarSize, iconSize } = vnode.attrs;
    return m('.ProjectInfoPanel', [
      m('.cf-info-header', [
        m('h3.cf-title', [
          iconSize && m(DummyChainIcon, {
            chain: null,
            onclick: null,
            size: iconSize
          }),
          DummyProjectData.ProjectTitle
        ]),
        m('.cf-block-count', `${DummyProjectData.ProjectBlockCount} Blocks`)
      ]),
      m('.cf-info-body', DummyProjectData.ProjectDescription),
      m('.cf-info-footer', [
        m(AnonymousUser, { // dummy user
            avatarSize,
            distinguishingKey: '123',
        })
      ])
    ]);
  }
}

const ProjectCard: m.Component<
  ProjectCardAttrs,
  ProjectCardState
> = {
  view: (vnode) => {
    const { project, size } = vnode.attrs;
    const onclick = null; // = m.route.set(`${app.activeId()}/${project.id}-slugify(project.name))

    const ProjectCardLarge = m('.ProjectCard',
      { class: 'large', onclick },
      [
        m(ProjectHeaderPanel, { iconSize: 45 }),
        m(ProjectCompletionBar, { completionPercent: (DummyProjectData.ProjectCompletionPercent as number) }),
        m(ProjectInfoPanel, { project, avatarSize: 20 })
      ]
    );

    const ProjectCardMedium= m('.ProjectCard',
      { class: 'medium', onclick },
      [
        m(ProjectHeaderPanel),
        m('.right-panel', [
          m(ProjectCompletionBar, { completionPercent: (DummyProjectData.ProjectCompletionPercent as number) }),
          m(ProjectInfoPanel, { project, avatarSize: 16, iconSize: 24 })
        ])
      ]
    );

    const ProjectCardSmall = m('.ProjectCard',
      { class: 'small', onclick },
      [
        m('h3', DummyProjectData.ProjectTitle),
        // TODO: Implement in kit
        // m(CWProjectStatus, { status: project.status })
        m(DummyChainIcon),
        m(DummyProjectData.Chain)
      ]
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

export default ProjectCard;