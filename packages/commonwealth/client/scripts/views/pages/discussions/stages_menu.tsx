/* @jsx m */

import m from 'mithril';
import {
  Button,
  Icons,
  PopoverMenu,
  MenuItem,
  MenuDivider,
} from 'construct-ui';

import 'pages/discussions/stages_menu.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { ThreadStage } from 'models';
import { threadStageToLabel } from 'helpers';

type StagesMenuAttrs = {
  disabled: boolean;
  parentState: any;
  selectedStage: ThreadStage;
  stage: string;
  stages: ThreadStage[];
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
                ? `Stage: ${threadStageToLabel(selectedStage)}`
                : 'All Stages'
            }
            iconRight={Icons.CHEVRON_DOWN}
            size="sm"
            disabled={disabled}
          />
        }
        hasArrow={false}
        transitionDuration={0}
        closeOnContentClick={true}
        content={
          <div class="stage-items">
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
                label={
                  <div class="stages-item">
                    {threadStageToLabel(targetStage)}
                    {targetStage === ThreadStage.Voting && (
                      <div class="discussions-stage-count">
                        {app.threads.numVotingThreads}
                      </div>
                    )}
                  </div>
                }
              />
            ))}
          </div>
        }
      />
    );
  }
}
