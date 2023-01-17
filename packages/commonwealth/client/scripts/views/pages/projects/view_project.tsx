/* @jsx m */
import 'pages/projects/view_project.scss';

import m from 'mithril';
import app from 'state';
import Web3 from 'web3';

import { Tag } from 'construct-ui';
import { CWText } from 'views/components/component_kit/cw_text';
import { ChainInfo, Project } from 'models';
import { weiToTokens } from 'helpers';
import Sublayout from 'views/sublayout';
import User from 'views/components/widgets/user';
import { PageNotFound } from 'views/pages/404';
import { MarkdownFormattedText } from 'views/components/quill/markdown_formatted_text';
import { CWTable } from 'views/components/component_kit/cw_table';
import { ProjectRole } from './types';
import ProjectCompletionBar from './project_completion_bar';
import SupportCard from './support_card';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CommunityLabel } from '../../components/community_label';
import { ChainNetwork } from '../../../../../../common-common/src/types';
import { PageLoading } from '../loading';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWTag } from '../../components/component_kit/cw_tag';

interface ProjectPageAttrs {
  identifier: string;
}

export class ProjectPage implements m.ClassComponent<ProjectPageAttrs> {
  private project: Project;
  private web3Initialized: boolean;
  private web3: Web3;
  private currentBlockNum: number;
  private tokenBalance: string;

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

  async getAcceptedProjectTokenUserBalance() {
    const balance = await app.projects.getUserERC20TokenBalance(
      this.project.token
    );
    this.tokenBalance = balance;
  }

  view(vnode: m.Vnode<ProjectPageAttrs>) {
    if (!app) return <PageLoading />;
    const { identifier } = vnode.attrs;

    if (typeof identifier !== 'string') {
      return <PageNotFound title="Projects" />;
    }

    // @TODO Remove admin toggles
    if (
      !app.roles.isAdminOfEntity({ chain: app.chain?.id }) &&
      !app.user.isSiteAdmin
    ) {
      return <PageNotFound />;
    }

    if (!app.projects.initialized) return <PageLoading />;

    const projectId = identifier.split('-')[0];
    this.project = app.projects.store.getById(projectId);
    if (!this.project) {
      if (app.projects.initializing) return <PageNotFound title="Projects" />;
    }

    const { project } = this;
    const threshold = +weiToTokens(project.threshold.toString(), 18);
    const fundingAmount = +weiToTokens(project.fundingAmount.toString(), 18);
    const chain: ChainInfo = app.config.chains.getById(project.chainId);

    this.getAcceptedProjectTokenUserBalance();

    return (
      <Sublayout
        title="Project"
        showNewProposalButton={false}
        hideSidebar={true}
      >
        <div class="ViewProject">
          <CWText type="h1">{project.title}</CWText>
          <div class="project-metadata">
            <div class="metadata-left">
              {!!chain && <CommunityLabel community={chain} size="large" />}
              {m(User, {
                avatarSize: 32,
                linkify: true,
                user: project.creatorAddressInfo,
              })}
            </div>
            <div class="metadata-right">
              <CWTag
                label={`Created on: ${project.createdAt
                  .format('MMMM D, YYYY')
                  .toString()}`}
              />
              <CWTag label={`Ends at block: ${project.deadline}`} />
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
                    {/* TODO, v2: Swap hardcoded ETH for token; use oracles for USD conversion */}
                  </div>
                  <div class="project-funds-goal">
                    <CWText type="h5">Goal</CWText>
                    <CWText type="h1">{threshold} ETH</CWText>
                    {/* TODO, v2: Swap hardcoded ETH for token; use oracles for USD conversion */}
                  </div>
                </div>
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
          <div class="project-token">
            <CWDivider />
            <CWText type="h1" textStyle="medium">
              Accepted Project Token:
            </CWText>
            {project.token}
          </div>
          <div class="">
            <CWDivider />
            <CWText type="h1" textStyle="medium">
              User Wallet Balance of Accepted Project Token:
            </CWText>
            {this.tokenBalance}
          </div>

          <div class="project-about">
            {m(MarkdownFormattedText, { doc: project.description })}
          </div>
          {!!project.backers.length && (
            <div class="project-backers">
              <CWDivider />
              <CWText type="h1" textStyle="medium">
                {<CWIcon iconSize="xxl" iconName="backer" />} Backers
              </CWText>
              <CWTable
                className="project-backer-table"
                tableName="Backers"
                headers={['Username', 'Amount']}
                // TODO v2: Hook up timestamps, separate out participation events in individual rows
                entries={project.backers.map((backer) => {
                  return [
                    m(User, { linkify: true, user: backer.addressInfo }),
                    m(
                      'span',
                      `${+weiToTokens(backer.amount.toString(), 18)} ETH`
                    ),
                  ];
                })}
              />
            </div>
          )}
          {!!project.curators.length && (
            <div class="project-curators">
              <CWDivider />
              <CWText type="h1" textStyle="medium">
                {<CWIcon iconSize="xxl" iconName="curator" />} Curators
              </CWText>
              <CWTable
                className="project-curator-table"
                tableName="curators"
                headers={['Username', 'Amount']}
                // TODO v2: Hook up timestamps, separate out participation events in individual rows
                entries={project.curators.map((curator) => {
                  return [
                    m(User, { linkify: true, user: curator.addressInfo }),
                    m(
                      'span',
                      `${+weiToTokens(curator.amount.toString(), 18)} ETH`
                    ),
                  ];
                })}
              />
            </div>
          )}
        </div>
      </Sublayout>
    );
  }
}

export default ProjectPage;
