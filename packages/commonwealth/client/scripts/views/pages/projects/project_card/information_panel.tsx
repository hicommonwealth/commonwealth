/* @jsx m */

import m from 'mithril';
import app from 'state';
import _ from 'lodash';
import ClassComponent from 'class_component';

import { ChainInfo, Project } from 'models';
import { weiToTokens } from 'helpers';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import User, { AnonymousUser } from 'views/components/widgets/user';
import { CWTag } from 'views/components/component_kit/cw_tag';
import { ProjectStatus } from '../types';

type InformationPanelAttrs = {
  project: Project;
  projectStatus: ProjectStatus;
}

export class InformationPanel
  extends ClassComponent<InformationPanelAttrs>
{
  getProjectShortDescription(p: Project) {
    if (p.shortDescription) return p.shortDescription;
    else {
      if (p.description.length > 244) {
        return `${p.description.slice(0, 241)}...`;
      } else {
        return p.description;
      }
    }
  }

  view(vnode: m.Vnode<InformationPanelAttrs>) {
    const { project, projectStatus } = vnode.attrs;
    const projectChain: ChainInfo = app.config.chains.getById(project.chainId);

    return (
      <div class="InformationPanel">
        <div class="funding-data">
          <CWTag
            intent="none"
            class={projectStatus}
            label={
              projectStatus ? (
                  projectStatus.toString()
              ) : (
                `${project.deadline} blocks`
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
          <CWText type="h5" fontWeight={"semiBold"}>
            {project.title}
          </CWText>
          <CWText type="caption">
            {this.getProjectShortDescription(project)}
          </CWText>
        </div>
        <div class="beneficiary-data">
          <div class="data-left">
            {m(User, {
              user: project.creatorAddressInfo,
            })}
          </div>
          <div class="data-right">
            {project.curatorFee > 0 && (
              <CWText type="caption">{project.curatorFee}% Curator Fee</CWText>
            )}
            {project.chainId && (
              <CWTag
                label={projectChain.name}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}
