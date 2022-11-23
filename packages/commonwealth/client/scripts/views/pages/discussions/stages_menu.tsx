/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
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
  selectedStage: ThreadStage;
  stage: string;
  stages: ThreadStage[];
};

export class StagesMenu extends ClassComponent<StagesMenuAttrs> {
  view(vnode: m.Vnode<StagesMenuAttrs>) {
    const { disabled, selectedStage, stage, stages } = vnode.attrs;

    return m(PopoverMenu, {
      trigger: m(Button, {
        rounded: true,
        compact: true,
        label: selectedStage
          ? `Stage: ${threadStageToLabel(selectedStage)}`
          : 'All Stages',
        iconRight: Icons.CHEVRON_DOWN,
        size: 'sm',
        disabled,
      }),
      hasArrow: false,
      transitionDuration: 0,
      closeOnContentClick: true,
      content: (
        <div class="stage-items">
          {m(MenuItem, {
            onclick: (e) => {
              e.preventDefault();
              navigateToSubpage('/');
            },
            active: !stage,
            iconLeft: !stage ? Icons.CHECK : null,
            label: 'All Stages',
          })}
          {m(MenuDivider)}
          {stages.map((targetStage) =>
            m(MenuItem, {
              active: stage === targetStage,
              iconLeft: stage === targetStage ? Icons.CHECK : null,
              onclick: (e) => {
                e.preventDefault();
                navigateToSubpage(`/?stage=${targetStage}`);
              },
              label: (
                <div class="stages-item">
                  {threadStageToLabel(targetStage)}
                  {targetStage === ThreadStage.Voting && (
                    <div class="discussions-stage-count">
                      {app.threads.numVotingThreads}
                    </div>
                  )}
                </div>
              ),
            })
          )}
        </div>
      ),
    });
  }
}
