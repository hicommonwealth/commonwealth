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
import { CWAvatar } from '../../components/component_kit/cw_avatar';
import { ProjectRole } from './types';
import ProjectCompletionBar from './project_completion_bar';

class ProjectHeaderPanel
  implements
    m.ClassComponent<{
      iconSize?: number;
      iconUrl?: string;
      coverImage: string;
      userRole?: ProjectRole;
      supportAmount?: BN;
    }>
{
  view(vnode) {
    const iconSize = vnode.attrs.iconSize || 32;
    const { iconUrl, coverImage, userRole, supportAmount } = vnode.attrs;
    const isSupporter = userRole !== ProjectRole.Author;
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
        {iconUrl && (
          <div
            class="chain-wrap"
            style={isSupporter ? 'top: 104px' : 'top: 8px'}
          >
            <CWAvatar iconUrl={iconUrl} size={iconSize} />
          </div>
        )}
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
                    <div class="project-deadline">{`${project.deadline} blocks`}</div>
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
    const { project } = vnode.attrs;

    const projectStatus = null;
    // project.deadline.isBefore(moment())
    // ? project.fundingAmount.gt(project.threshold)
    //   ? 'succeeded'
    //   : 'failed'
    // : null;

    const onclick = () => {
      console.log(`project/${project.id}-${slugify(project.title)}`);
      m.route.set(`project/${project.id}-${slugify(project.title)}`);
    };

    const [userRole, supportAmount] = this.getUserRoles(
      project,
      app.user.addresses
    );

    const iconUrl = project.chainId
      ? null
      : app.config.chains.getById(project.chainId)?.iconUrl;

    return (
      <div class="ProjectCard large" onclick={onclick}>
        <ProjectHeaderPanel
          iconSize={32}
          iconUrl={iconUrl}
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
