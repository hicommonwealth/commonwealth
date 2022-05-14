import 'pages/projects/view_project.scss';

import m from 'mithril';
import { Tag } from 'construct-ui';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { ProjectCompletionBar } from './project_card';
import { Project } from './index';
import Sublayout from '../../../sublayout';
import { AnonymousUser } from '../../../components/widgets/user';
import { CWButton } from '../../../components/component_kit/cw_button';
import { PageNotFound } from '../../404';
import { DummyProject } from './dummy_project';
import MarkdownFormattedText from '../../../components/markdown_formatted_text';
import { CWTable } from '../../../components/component_kit/cw_table';

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
        class="ProjectPage"
        showNewProposalButton={false}
      >
        <div class="project-wrap">
          <CWText type="h1">project.title</CWText>
          <div class="project-metadata">
            <div class="metadata-left">
              <CWText type="h2">project.token</CWText>
              {/* TODO: replace with // m(User, { user: project.creator }) */}
              {m(AnonymousUser, { distinguishingKey: '1' })}
            </div>
            <div class="metadata-right">
              <Tag label={`${project.createdAt.format('MMMM D, YYYY')}`} />
              <Tag label={`${project.deadline.inBlocks} Blocks`} />
            </div>
          </div>
          <CWText type="h1" class="project-short-description">
            {project.shortDescription || project.description.slice(0, 100)}
          </CWText>
          <image class="project-header-img" src={project.coverImage} />
          <ProjectCompletionBar
            completionPercent={project.progress.asPercent}
          />
          <div class="project-funding-data">
            <div class="left-panel">
              <div class="project-funds-raised">
                <CWText type="h3">Funds raised</CWText>
                <CWText type="h1">{project.raised.inTokens} ETH</CWText>
                {/* TODO: ETH shouldn't be hardcoded */}
              </div>
              <div class="project-funds-goal">
                <CWText type="h3">Goal</CWText>
                <CWText type="h1">{project.threshold.inTokens} ETH</CWText>
                {/* TODO: ETH shouldn't be hardcoded */}
              </div>
            </div>
            <div class="right-panel">
              <CWButton
                intent="primary"
                label="Contribute to this project"
                onclick={() => true}
              />
            </div>
          </div>
          <div class="project-curator-data">
            <CWButton
              intent="secondary"
              disabled={true}
              label={project.beneficiary.address.slice(0, 7)}
            />
          </div>
          <CWText type="h3">
            Curator receives `${project.curatorCut * 100}`% of funds.
          </CWText>
          <div class="project-about">
            <CWText type="h1">About</CWText>
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
