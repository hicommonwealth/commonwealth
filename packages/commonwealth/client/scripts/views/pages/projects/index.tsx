/* @jsx m */
import 'pages/projects/index.scss';

import m from 'mithril';
import app from 'state';
import Web3 from 'web3';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTab, CWTabBar } from 'views/components/component_kit/cw_tabs';
import { notifyInfo } from 'controllers/app/notifications';
import { CWButton } from 'views/components/component_kit/cw_button';
import { ChainNetwork } from 'common-common/src/types';
import { Project } from 'models';
import Sublayout from 'views/sublayout';
import ExplorePage from './explore_page';
import YoursPage from './yours_page';
import { getUserEthChains } from './helpers';
import { PageLoading } from '../loading';

export default class ProjectListing implements m.ClassComponent {
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

  async getBlockNumber() {
    this.currentBlockNum = await this.web3.eth.getBlockNumber();
  }

  getUserProjects(): Project[] {
    const userProjects: Project[] = [];
    app.user.addresses.forEach(({ address, chain }) => {
      app.projects.store
        .getAll()
        .filter((project) =>
          app.activeChainId() ? project.chainId === app.activeChainId() : true
        )
        .filter(
          (project) =>
            project.isAuthor(address, chain.id) ||
            project.isBacker(address, chain.id) ||
            project.isCurator(address, chain.id)
        )
        .forEach((project) => userProjects.push(project));
    });
    return userProjects;
  }

  view() {
    if (!app) return <PageLoading />;

    const onExplorePage = m.route.get().includes('/explore');
    const onYoursPage = m.route.get().includes('/yours');
    const redirectToExplore =
      (!onExplorePage && !onYoursPage) || (onYoursPage && !app.isLoggedIn);
    if (redirectToExplore) {
      m.route.set('/projects/explore');
      return;
    }

    if (!this.web3Initialized) {
      this.initializeWeb3();
      this.getBlockNumber();
    }

    // Prefer Ethereum as default chainId for new projects, unless user
    // is a member of ETH chains that do not include Ethereum
    const userEthChains = getUserEthChains(app);
    const defaultProjectChain =
      !userEthChains.length || userEthChains.find((c) => c.id === 'ethereum')
        ? 'ethereum'
        : userEthChains[0].id;
    console.log(this.getUserProjects());
    return (
      <Sublayout
        title="Projects"
        hideSearch={true}
        hideSidebar={true}
        showNewProposalButton={false}
        alwaysShowTitle={true}
      >
        <div class="ProjectListing">
          <div class="listing-header">
            <CWText type="h1">Crowdfunding</CWText>
            <CWTabBar align="left" bordered={false} fluid={true}>
              <CWTab
                label={[
                  <CWText type="h5" fontWeight="semibold">
                    Explore
                  </CWText>,
                ]}
                isSelected={onExplorePage}
                onclick={() => {
                  if (onExplorePage) return;
                  m.route.set(m.route.get().replace('yours', 'explore'));
                  m.redraw();
                }}
              />
              <CWTab
                label={[
                  <CWText type="h5" fontWeight="semibold">
                    Your Projects
                  </CWText>,
                ]}
                disabled={
                  !app.isLoggedIn() || this.getUserProjects().length === 0
                }
                isSelected={onYoursPage}
                onclick={() => {
                  if (onYoursPage) return;
                  m.route.set(m.route.get().replace('explore', 'yours'));
                  m.redraw();
                }}
              />
            </CWTabBar>
            <CWButton
              disabled={!app.isLoggedIn()}
              label="Create Project"
              onclick={() => m.route.set(`/${defaultProjectChain}/new/project`)}
            />
          </div>
          <div class="listing-body">
            {onExplorePage ? (
              <ExplorePage currentBlockNum={this.currentBlockNum} />
            ) : (
              <YoursPage
                currentBlockNum={this.currentBlockNum}
                userProjects={this.getUserProjects()}
              />
            )}
          </div>
        </div>
      </Sublayout>
    );
  }
}
