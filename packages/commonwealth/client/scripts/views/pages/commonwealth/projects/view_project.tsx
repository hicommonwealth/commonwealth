/* @jsx m */
import 'pages/projects/view_project.scss';

import m from 'mithril';
import { Tag } from 'construct-ui';
import { CWText } from 'views/components/component_kit/cw_text';
import { Project } from 'models';
import { weiToTokens } from 'helpers';
import { ProjectCompletionBar, ProjectRole } from './project_card';
import Sublayout from '../../../sublayout';
import { AnonymousUser } from '../../../components/widgets/user';
import { PageNotFound } from '../../404';
import { MarkdownFormattedText } from '../../../components/quill/markdown_formatted_text';
import { CWTable } from '../../../components/component_kit/cw_table';
import { createNewDummyProject } from './dummy_project';
import SupportCard from './support_card';

interface ProjectPageAttrs {
  identifier: string;
}

export class ProjectPage implements m.ClassComponent<ProjectPageAttrs> {
  private project: Project;
  view(vnode: m.Vnode<ProjectPageAttrs>) {
    const { identifier } = vnode.attrs;
    if (typeof identifier !== 'string') {
      return m(PageNotFound, { title: 'Projects' });
    }
    // const projectId = identifier.split('-')[0];
    if (!this.project) {
      this.project = createNewDummyProject({}); // TODO: Fetch via controller
    }
    return (
      <Sublayout
        title="Project"
        showNewProposalButton={false}
        hideQuickSwitcher={true}
        hideSidebar={true}
      >
        <div class="ViewProject">
          <CWText type="h1">{this.project.title}</CWText>
          <div class="project-metadata">
            <div class="metadata-left">
              {/* TODO: Investigate why Chain/TokenIcon + CommLabel invocation is throwing */}
              {/* <CommunityLabel chain={this.project.chain} size={32} /> */}
              {/* TODO: replace below with proper m(User, { user: this.project.creator }) */}
              {m(AnonymousUser, { avatarSize: 32, distinguishingKey: '1' })}
            </div>
            <div class="metadata-right">
              <Tag label={`${this.project.createdAt.format('MMMM D, YYYY')}`} />
              <Tag label={`${this.project.deadline} Blocks`} />
            </div>
          </div>

          <div class="project-overview-and-support">
            <div class="project-overview-panel">
              <img class="project-header-img" src={this.project.coverImage} />
              <ProjectCompletionBar
                completionPercent={this.project.fundingAmount.div(
                  this.project.threshold
                )}
              />
              <div class="project-funding-data">
                <div class="left-panel">
                  <div class="project-funds-raised">
                    <CWText type="h5">Funds raised</CWText>
                    <CWText type="h1">
                      {weiToTokens(this.project.fundingAmount.toString(), 18)}{' '}
                      ETH
                    </CWText>
                    {/* TODO: ETH shouldn't be hardcoded—we need a token address --> symbol converter */}
                    {/* TODO, v2: We need oracles for USD conversion */}
                  </div>
                  <div class="project-funds-goal">
                    <CWText type="h5">Goal</CWText>
                    <CWText type="h1">
                      {weiToTokens(this.project.threshold.toString(), 18)} ETH
                    </CWText>
                    {/* TODO: ETH shouldn't be hardcoded—we need a token address --> symbol converter */}
                    {/* TODO, v2: We need oracles for USD conversion */}
                  </div>
                </div>
              </div>
              <div class="project-curator-data">
                {/* TODO: Replace with actual user */}
                {m(AnonymousUser, { avatarSize: 16, distinguishingKey: '2' })}
                <CWText type="caption">
                  Curator receives {(this.project.curatorFee as any) * 100}% of
                  funds.
                </CWText>
              </div>
            </div>
            <div class="project-support-panel">
              <SupportCard
                project={this.project}
                supportType={ProjectRole.Backer}
              />
              <SupportCard
                project={this.project}
                supportType={ProjectRole.Curator}
              />
            </div>
          </div>

          <div class="project-about">
            {m(MarkdownFormattedText, { doc: this.project.description })}
            <hr />
            <div class="project-backers">
              <CWTable
                className="project-backer-table"
                tableName="Backers"
                headers={['Backer', 'Amount']}
                // TODO: CW user lookup
                entries={this.project.backers.map((backer) => {
                  return [
                    m('span', `${backer.address}`),
                    // TODO: ETH shouldn't be hardcoded
                    m('span', `${backer.amount} ETH`),
                  ];
                })}
              />
            </div>
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default ProjectPage;
