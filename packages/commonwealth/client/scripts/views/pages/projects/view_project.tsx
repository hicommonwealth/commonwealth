/* @jsx m */
import 'pages/projects/view_project.scss';

import m from 'mithril';
import app from 'state';
import { Tag } from 'construct-ui';
import { CWText } from 'views/components/component_kit/cw_text';
import { AddressInfo, ChainInfo, Project } from 'models';
import { weiToTokens } from 'helpers';
import Sublayout from 'views/sublayout';
import User, { AnonymousUser } from 'views/components/widgets/user';
import { PageNotFound } from 'views/pages/404';
import { MarkdownFormattedText } from 'views/components/quill/markdown_formatted_text';
import { CWTable } from 'views/components/component_kit/cw_table';
import { ProjectRole } from './types';
import ProjectCompletionBar from './project_completion_bar';
import SupportCard from './support_card';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CommunityLabel } from '../../components/community_label';
import Web3 from 'web3';
import { ChainNetwork } from '../../../../../../common-common/src/types';

interface ProjectPageAttrs {
  identifier: string;
}

export class ProjectPage implements m.ClassComponent<ProjectPageAttrs> {
  private project: Project;
  private web3Initialized: boolean;
  private web3: Web3;
  private currentBlockNum: number;

  async initializeWeb3() {
    const cmnUrl = app.config.chains.getById(ChainNetwork.CommonProtocol)?.node
      ?.url;
    if (!cmnUrl) return;
    try {
      const provider = new Web3.providers.WebsocketProvider(cmnUrl);
      this.web3 = new Web3(provider);
    } catch (error) {
      console.log(`Could not connect to Ethereum on ${cmnUrl}`);
      throw error;
    }
    this.web3Initialized = true;
  }

  view(vnode: m.Vnode<ProjectPageAttrs>) {
    if (!app) return;

    const { identifier } = vnode.attrs;
    if (typeof identifier !== 'string') {
      return m(PageNotFound, { title: 'Projects' });
    }

    const projectId = identifier.split('-')[0];
    this.project = app.projects.store.getById(projectId);
    if (!this.project) {
      return m(PageNotFound, { title: 'Projects' });
    }
    const { project } = this;

    const threshold = +weiToTokens(project.threshold.toString(), 18);
    const fundingAmount = +weiToTokens(project.fundingAmount.toString(), 18);
    const chain: ChainInfo = project.chainId
      ? app.config.chains.getById(project.chainId)
      : null;
    console.log({ chain });
    return (
      <Sublayout
        title="Project"
        showNewProposalButton={false}
        hideQuickSwitcher={true}
        hideSidebar={true}
      >
        <div class="ViewProject">
          <CWText type="h1">{project.title}</CWText>
          <div class="project-metadata">
            <div class="metadata-left">
              {!!chain?.name && (
                <CommunityLabel community={chain} size="large" />
              )}
              {/* {m(User, { avatarSize: 32, user: project.creatorAddressInfo })} */}
            </div>
            <div class="metadata-right">
              <Tag label={`${project.createdAt.format('MMMM D, YYYY')}`} />
              <Tag label={`${project.deadline} Blocks`} />
            </div>
          </div>

          <div class="project-overview-and-support">
            <div class="project-overview-panel">
              {project.coverImage && (
                <img class="project-header-img" src={project.coverImage} />
              )}
              <ProjectCompletionBar
                completionPercent={project.completionPercent}
              />
              <div class="project-funding-data">
                <div class="left-panel">
                  <div class="project-funds-raised">
                    <CWText type="h5">Funds raised</CWText>
                    <CWText type="h1">{fundingAmount} ETH</CWText>
                    {/* TODO: ETH shouldn't be hardcoded—we need a token address --> symbol converter */}
                    {/* TODO, v2: We need oracles for USD conversion */}
                  </div>
                  <div class="project-funds-goal">
                    <CWText type="h5">Goal</CWText>
                    <CWText type="h1">{threshold} ETH</CWText>
                    {/* TODO: ETH shouldn't be hardcoded—we need a token address --> symbol converter */}
                    {/* TODO, v2: We need oracles for USD conversion */}
                  </div>
                </div>
              </div>
              <div class="project-curator-data">
                {/* TODO: Replace with actual user */}
                {m(AnonymousUser, { avatarSize: 16, distinguishingKey: '2' })}
                <CWText type="caption">
                  Curator receives {project.curatorFee.toNumber() / 100}% of
                  funds.
                </CWText>
              </div>
            </div>
            <div class="project-support-panel">
              <SupportCard project={project} supportType={ProjectRole.Backer} />
              <SupportCard
                project={project}
                supportType={ProjectRole.Curator}
              />
            </div>
          </div>

          <div class="project-about">
            {m(MarkdownFormattedText, { doc: project.description })}
            {(!!project.backers.length || !!project.curators.length) && (
              <CWDivider />
            )}
            {!!project.backers.length && (
              <div class="project-backers">
                <CWText type="h1" textStyle="medium">
                  Backers
                </CWText>
                <CWTable
                  className="project-backer-table"
                  tableName="Backers"
                  headers={['Backer', 'Amount']}
                  // TODO: CW user lookup
                  entries={project.backers.map((backer) => {
                    return [
                      m('span', `${backer.address}`),
                      // TODO: ETH shouldn't be hardcoded
                      m('span', `${backer.amount} ETH`),
                    ];
                  })}
                />
              </div>
            )}
            {!!project.curators.length && (
              <div class="project-curators">
                <CWText type="h1" textStyle="medium">
                  Curators
                </CWText>
                <CWTable
                  className="project-curator-table"
                  tableName="curators"
                  headers={['curator', 'Amount']}
                  // TODO: CW user lookup
                  entries={project.curators.map((curator) => {
                    return [
                      m('span', `${curator.address}`),
                      // TODO: ETH shouldn't be hardcoded
                      m('span', `${curator.amount} ETH`),
                    ];
                  })}
                />
              </div>
            )}
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default ProjectPage;
