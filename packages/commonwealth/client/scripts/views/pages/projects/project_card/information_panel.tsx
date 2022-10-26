/* @jsx m */

import m from 'mithril';
import app from 'state';
import _ from 'lodash';

import { ChainInfo, Project } from 'models';
import { weiToTokens } from 'helpers';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { AnonymousUser } from 'views/components/widgets/user';
import { Tag } from 'construct-ui';
import { ProjectStatus } from '../types';

interface InfoPanelAttrs {
  project: Project;
  avatarSize: number;
  projectStatus: ProjectStatus;
}

export class InfoPanel implements m.ClassComponent<InfoPanelAttrs> {
  view(vnode: m.Vnode<InfoPanelAttrs>) {
    const { project, projectStatus, avatarSize } = vnode.attrs;
    const projectChain: ChainInfo = app.config.chains.getById(project.chainId);
    return (
      <div class="InfoPanel">
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
          {/* // TODO: Make real user */}
          {m(AnonymousUser, {
            avatarSize,
            distinguishingKey: '123',
          })}
          {project.chainId && (
            <Tag
              label={
                <CWText type="caption" fontWeight="medium">
                  {projectChain.name}
                </CWText>
              }
            />
          )}
        </div>
      </div>
    );
  }
}
