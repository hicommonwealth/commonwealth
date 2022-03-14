/* @jsx m */

import m from 'mithril';
import {
  Button,
  Icons,
  PopoverMenu,
  MenuItem,
  MenuDivider,
} from 'construct-ui';

import 'pages/discussions/discussion_filter_bar.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { OffchainThreadStage } from 'models';
import { offchainThreadStageToLabel } from 'helpers';

type StagesMenuAttrs = {
  disabled: boolean;
  parentState: any;
  selectedStage: OffchainThreadStage;
  stage: string;
  stages: OffchainThreadStage[];
};

export class StagesMenu implements m.ClassComponent<StagesMenuAttrs> {
  view(vnode) {
    const { disabled, parentState, selectedStage, stage, stages } = vnode.attrs;
    return (
      <PopoverMenu
        trigger={
          <Button
            rounded={true}
            compact={true}
            label={
              selectedStage
                ? `Stage: ${offchainThreadStageToLabel(selectedStage)}`
                : 'All Stages'
            }
            iconRight={Icons.CHEVRON_DOWN}
            size="sm"
            disabled={disabled}
          />
        }
        inline={true}
        hasArrow={false}
        transitionDuration={0}
        closeOnContentClick={true}
        content={
          <div class="discussions-stage-items">
            <MenuItem
              onclick={(e) => {
                e.preventDefault();
                parentState.summaryView = false;
                localStorage.setItem('discussion-summary-toggle', 'false');
                navigateToSubpage('/');
              }}
              active={!stage}
              iconLeft={!stage ? Icons.CHECK : null}
              label="All Stages"
            />
            <MenuDivider />
            {stages.map((targetStage) => (
              <MenuItem
                active={stage === targetStage}
                iconLeft={stage === targetStage ? Icons.CHECK : null}
                onclick={(e) => {
                  e.preventDefault();
                  parentState.summaryView = false;
                  localStorage.setItem('discussion-summary-toggle', 'false');
                  navigateToSubpage(`/?stage=${targetStage}`);
                }}
                label={[
                  `${offchainThreadStageToLabel(targetStage)}`,
                  targetStage === OffchainThreadStage.Voting && (
                    <div class="discussions-stage-count">
                      {app.threads.numVotingThreads}
                    </div>
                  ),
                ]}
              />
            ))}
          </div>
        }
      />
    );
  }
}
