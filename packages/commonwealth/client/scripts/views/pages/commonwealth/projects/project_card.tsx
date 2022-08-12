/* @jsx m */

import 'pages/projects/project_card.scss';

import m from 'mithril';
import _ from 'lodash';
import { slugify } from 'utils';
import { CWText } from 'views/components/component_kit/cw_text';
import { AnonymousUser } from 'views/components/widgets/user';
import { AddressInfo, Project } from 'models';
import { Tag } from 'construct-ui';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { weiToTokens } from 'helpers';
import BN from 'bn.js';
import app from 'state';
import moment from 'moment';

export enum ProjectRole {
  Curator = 'curator',
  Backer = 'backer',
  Author = 'author',
}

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
      userRole?: ProjectRole;
      supportAmount?: BN;
    }>
{
  view(vnode) {
    const iconSize = vnode.attrs.iconSize || 32;
    const { coverImage, userRole, supportAmount } = vnode.attrs;
    const isSupporter = userRole !== ProjectRole.Author;
    console.log(userRole);
    return (
      <div
        class="ProjectHeaderPanel"
        style={`background-image: url("${coverImage}");`}
      >
        {userRole && (
          <div class={`user-role-banner ${userRole}`}>
            <div class="banner-left">
              <CWText type="caption" fontWeight="uppercase">
                {_.capitalize(userRole)}
              </CWText>
              {isSupporter && (
                <CWIcon iconName={userRole} iconSize="small"></CWIcon>
              )}
            </div>
            <div class="banner-right">
              {isSupporter && (
                <CWText type="caption" fontWeight="uppercase">
                  {' '}
                  {weiToTokens(supportAmount.toString(), 18)} ETH
                </CWText>
              )}
            </div>
          </div>
        )}
        {iconSize && (
          <div
            class="dummy-chain-wrap"
            style={isSupporter ? 'top: 104px' : 'top: 8px'}
          >
            <DummyChainIcon chain={null} onclick={null} size={iconSize} />
          </div>
        )}
      </div>
    );
  }
}

export class ProjectCompletionBar
  implements
    m.ClassComponent<{
      completionPercent: number;
      projectStatus?: 'succeeded' | 'failed';
    }>
{
  view(vnode) {
    const { completionPercent, projectStatus } = vnode.attrs;
    return (
      <div class="ProjectCompletionBar">
        <div
          class={`completed-percentage ${projectStatus}`}
          style={`width: ${completionPercent * 400}px`}
        />
      </div>
    );
  }
}

interface ProjectInfoAttrs {
  project: Project;
  avatarSize: number;
  projectStatus: 'succeeded' | 'failed';
}
class ProjectInfoPanel implements m.ClassComponent<ProjectInfoAttrs> {
  view(vnode: m.Vnode<ProjectInfoAttrs>) {
    const { project, projectStatus, avatarSize } = vnode.attrs;

    return (
      <div class="ProjectInfoPanel">
        <div class="funding-data">
          <Tag
            intent="none"
            class={projectStatus}
            label={
              projectStatus ? (
                <CWText type="caption" fontWeight="medium">
                  {_.capitalize(projectStatus)}
                </CWText>
              ) : (
                <>
                  <CWIcon iconName="clock" iconSize="small" />
                  <CWText type="caption" fontWeight="medium">
                    <div class="project-deadline">{`${project.deadline.fromNow(
                      true
                    )}`}</div>
                  </CWText>
                </>
              )
            }
          />
          <div class="funding-state">
            <CWText type="h5" fontWeight="bold">
              {weiToTokens(project.fundingAmount.toString(), 18)} ETH
            </CWText>
            <CWText type="h5">
              of {weiToTokens(project.threshold.toString(), 18)} ETH
            </CWText>
          </div>
        </div>
        <div class="description">
          <CWText type="h5">{project.title}</CWText>
          <CWText type="caption">
            {project.shortDescription || project.description}
          </CWText>
        </div>
        <div class="beneficiary-data">
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
  getUserRoles(project: Project, addresses: AddressInfo[]) {
    let backingAmount = new BN(0);
    let curatorAmount = new BN(0);
    let isAuthor = false;
    let isCurator = false;
    let isBacker = false;
    for (const address of addresses) {
      const addressInfo: [string, string] = [address.address, address.chain];
      if (project.isAuthor(...addressInfo)) {
        isAuthor = true;
      }
      if (project.isCurator(...addressInfo)) {
        isCurator = true;
        curatorAmount = curatorAmount.add(
          project.getCuratedAmount(...addressInfo)
        );
      }
      if (project.isBacker(...addressInfo)) {
        isBacker = true;
        backingAmount = backingAmount.add(
          project.getBackedAmount(...addressInfo)
        );
      }
    }
    if (isAuthor) {
      return [ProjectRole.Author, null];
    } else if (isCurator) {
      return [ProjectRole.Curator, curatorAmount];
    } else if (isBacker) {
      return [ProjectRole.Backer, backingAmount];
    } else {
      return [null, null];
    }
  }

  view(vnode: m.Vnode<ProjectCardAttrs>) {
    const { project, size } = vnode.attrs;

    const projectStatus = project.deadline.isBefore(moment())
      ? project.fundingAmount.gt(project.threshold)
        ? 'succeeded'
        : 'failed'
      : null;

    const onclick = () => {
      console.log(`project/${project.id}-${slugify(project.title)}`);
      m.route.set(`project/${project.id}-${slugify(project.title)}`);
    };

    console.log(app.user.addresses);
    const [userRole, supportAmount] = this.getUserRoles(
      project,
      app.user.addresses
    );
    console.log({ userRole, supportAmount });
    // const userRole = ProjectRole.Curator;
    // const supportAmount = '320000000000000000';

    return (
      <div class="ProjectCard large" onclick={onclick}>
        <ProjectHeaderPanel
          iconSize={32}
          coverImage={project.coverImage}
          userRole={userRole}
          supportAmount={supportAmount}
        />
        <ProjectCompletionBar
          completionPercent={project.completionPercent}
          projectStatus={projectStatus}
        />
        <ProjectInfoPanel
          project={project}
          avatarSize={16}
          projectStatus={projectStatus}
        />
      </div>
    );
  }
}
