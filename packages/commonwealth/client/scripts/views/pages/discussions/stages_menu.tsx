/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'pages/discussions/stages_menu.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { ThreadStage } from 'models';
import { threadStageToLabel } from 'helpers';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWPopover } from '../../components/component_kit/cw_popover/cw_popover';
import { getClasses } from '../../components/component_kit/helpers';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWDivider } from '../../components/component_kit/cw_divider';

type ThreadsFilterMenuItemAttrs = {
  iconRight?: ResultNode;
  isSelected: boolean;
  label: string;
  onClick: (e: any) => void;
};

export class ThreadsFilterMenuItem extends ClassComponent<ThreadsFilterMenuItemAttrs> {
  view(vnode: ResultNode<ThreadsFilterMenuItemAttrs>) {
    const { iconRight, isSelected, label, onClick } = vnode.attrs;

    return (
      <div
        className={getClasses<{ isSelected: boolean }>(
          { isSelected },
          'ThreadsFilterMenuItem'
        )}
        onClick={onClick}
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
  view(vnode: ResultNode<StagesMenuAttrs>) {
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
          <div className="threads-filter-menu-items">
            <ThreadsFilterMenuItem
              label="All Stages"
              isSelected={!stage}
              onClick={(e) => {
                e.preventDefault();
                navigateToSubpage('/discussions');
              }}
            />
            <CWDivider />
            {stages.map((targetStage) => (
              <ThreadsFilterMenuItem
                isSelected={stage === targetStage}
                onClick={(e) => {
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
