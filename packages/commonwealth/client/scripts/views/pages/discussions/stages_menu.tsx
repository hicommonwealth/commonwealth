/* @jsx m */

import { navigateToSubpage } from 'app';
import ClassComponent from 'class_component';
import { threadStageToLabel } from 'helpers';
import m from 'mithril';
import { ThreadStage } from 'models';

import 'pages/discussions/stages_menu.scss';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWPopover } from '../../components/component_kit/cw_popover/cw_popover';
import { getClasses } from '../../components/component_kit/helpers';

type ThreadsFilterMenuItemAttrs = {
  iconRight?: m.Vnode;
  isSelected: boolean;
  label: string;
  onclick: (e: any) => void;
};

export class ThreadsFilterMenuItem extends ClassComponent<ThreadsFilterMenuItemAttrs> {
  view(vnode: m.Vnode<ThreadsFilterMenuItemAttrs>) {
    const { iconRight, isSelected, label, onclick } = vnode.attrs;

    return (
      <div
        class={getClasses<{ isSelected: boolean }>(
          { isSelected },
          'ThreadsFilterMenuItem'
        )}
        onclick={onclick}
      >
        {isSelected && <CWIcon iconName="check" iconSize="small" />}
        {label}
        {iconRight}
      </div>
    );
  }
}

type StagesMenuAttrs = {
  selectedStage: ThreadStage;
  stage: string;
  stages: Array<ThreadStage>;
};

export class StagesMenu extends ClassComponent<StagesMenuAttrs> {
  view(vnode: m.Vnode<StagesMenuAttrs>) {
    const { selectedStage, stage, stages } = vnode.attrs;

    return (
      <CWPopover
        trigger={
          <CWButton
            buttonType="mini-white"
            label={
              selectedStage
                ? `Stage: ${threadStageToLabel(selectedStage)}`
                : 'All Stages'
            }
            iconRight="chevronDown"
          />
        }
        content={
          <div class="threads-filter-menu-items">
            <ThreadsFilterMenuItem
              label="All Stages"
              isSelected={!stage}
              onclick={(e) => {
                e.preventDefault();
                navigateToSubpage('/discussions');
              }}
            />
            <CWDivider />
            {stages.map((targetStage) => (
              <ThreadsFilterMenuItem
                isSelected={stage === targetStage}
                onclick={(e) => {
                  e.preventDefault();
                  navigateToSubpage(`/discussions?stage=${targetStage}`);
                }}
                label={`
                    ${threadStageToLabel(targetStage)} ${
                  targetStage === ThreadStage.Voting
                    ? app.threads.numVotingThreads
                    : ''
                }`}
              />
            ))}
          </div>
        }
      />
    );
  }
}
