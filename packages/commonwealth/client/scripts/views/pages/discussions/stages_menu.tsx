/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
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
  selectedStage: ThreadStage;
  stage: string;
  stages: Array<ThreadStage>;
};

export class StagesMenu extends ClassComponent<StagesMenuAttrs> {
  view(vnode: ResultNode<StagesMenuAttrs>) {
    const { selectedStage, stage, stages } = vnode.attrs;

    return render(PopoverMenu, {
      trigger: render(Button, {
        rounded: true,
        compact: true,
        label: selectedStage
          ? `Stage: ${threadStageToLabel(selectedStage)}`
          : 'All Stages',
        iconRight: Icons.CHEVRON_DOWN,
        size: 'sm',
      }),
      hasArrow: false,
      transitionDuration: 0,
      closeOnContentClick: true,
      content: (
        <div className="stage-items">
          {render(MenuItem, {
            onclick: (e) => {
              e.preventDefault();
              navigateToSubpage('/discussions');
            },
            active: !stage,
            iconLeft: !stage ? Icons.CHECK : null,
            label: 'All Stages',
          })}
          {render(MenuDivider)}
          {stages.map((targetStage) =>
            render(MenuItem, {
              active: stage === targetStage,
              iconLeft: stage === targetStage ? Icons.CHECK : null,
              onclick: (e) => {
                e.preventDefault();
                navigateToSubpage(`/discussions?stage=${targetStage}`);
              },
              label: (
                <div className="stages-item">
                  {threadStageToLabel(targetStage)}
                  {targetStage === ThreadStage.Voting && (
                    <div className="discussions-stage-count">
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
