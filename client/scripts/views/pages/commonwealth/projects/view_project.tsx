/* @jsx m */
import 'pages/projects/view_project.scss';

import m from 'mithril';
import { Tag } from 'construct-ui';
import { CWText } from 'views/components/component_kit/cw_text';
import { ProjectCompletionBar } from './project_card';
import Sublayout from '../../../sublayout';
import { AnonymousUser } from '../../../components/widgets/user';
import { CWButton } from '../../../components/component_kit/cw_button';
import { PageNotFound } from '../../404';
import { DummyProject } from './dummy_project';
import MarkdownFormattedText from '../../../components/markdown_formatted_text';
import { CWTable } from '../../../components/component_kit/cw_table';
import { Project } from '.';

interface ProjectPageAttrs {
  identifier: string;
}

export class ProjectPage implements m.ClassComponent<ProjectPageAttrs> {
  view(vnode) {
    const { identifier } = vnode.attrs;
    if (typeof identifier !== 'string') {
      return m(PageNotFound, { title: 'Projects' });
    }
    // const projectId = identifier.split('-')[0];
    const project: Project = DummyProject; // TODO: Fetch via controller

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
              {/* TODO: Investigate why Chain/TokenIcon + CommLabel invocation is throwing */}
              {/* <CommunityLabel chain={project.chain} size={32} /> */}
              {/* TODO: replace below with proper m(User, { user: project.creator }) */}
              {m(AnonymousUser, { avatarSize: 32, distinguishingKey: '1' })}
            </div>
            <div class="metadata-right">
              <Tag label={`${project.createdAt.format('MMMM D, YYYY')}`} />
              <Tag label={`${project.deadline.inBlocks} Blocks`} />
            </div>
          </div>
          <img class="project-header-img" src={project.coverImage} />
          <ProjectCompletionBar
            completionPercent={project.progress.asPercent}
          />
          <div class="project-funding-data">
            <div class="left-panel">
              <div class="project-funds-raised">
                <CWText type="h5">Funds raised</CWText>
                <CWText type="h1">{project.raised.inTokens} ETH</CWText>
                {/* TODO: ETH shouldn't be hardcoded */}
                {/* TODO: We need oracles for USD conversion */}
              </div>
              <div class="project-funds-goal">
                <CWText type="h5">Goal</CWText>
                <CWText type="h1">{project.threshold.inTokens} ETH</CWText>
                {/* TODO: ETH shouldn't be hardcoded */}
                {/* TODO: We need oracles for USD conversion */}
              </div>
            </div>
            <div class="right-panel">
              <CWButton
                intent="primary"
                label="Contribute"
                onclick={() => true}
              />
            </div>
          </div>
          <div class="project-curator-data">
            {m(AnonymousUser, { avatarSize: 16, distinguishingKey: '2' })}
            <CWText type="caption">
              Curator receives {project.curatorCut * 100}% of funds.
            </CWText>
          </div>
          <div class="project-about">
            {m(MarkdownFormattedText, { doc: project.description })}
            <hr />
            <div class="project-backers">
              <CWTable
                className="project-backer-table"
                tableName="Backers"
                headers={['Backer', 'Amount']}
                entries={project.backers.map((backer) => {
                  return [
                    m('span', `${backer.backerAddress}`),
                    // TODO: ETH shouldn't be hardcoded
                    m('span', `${backer.backerAmount} ETH`),
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
