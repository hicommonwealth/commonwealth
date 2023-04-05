import React from 'react';
import ClickAwayListener from '@mui/base/ClickAwayListener';

import { threadStageToLabel } from 'helpers';
import { ThreadStage } from 'models';

import 'pages/discussions/stages_menu.scss';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import {
  Popover,
  usePopover,
} from '../../components/component_kit/cw_popover/cw_popover';
import { getClasses } from '../../components/component_kit/helpers';
import { useCommonNavigate } from 'navigation/helpers';

type ThreadsFilterMenuItemProps = {
  iconRight?: React.ReactNode;
  isSelected: boolean;
  label: string;
  onClick: (e: any) => void;
};

export const ThreadsFilterMenuItem = (props: ThreadsFilterMenuItemProps) => {
  const { iconRight, isSelected, label, onClick } = props;

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
};

type StagesMenuProps = {
  selectedStage: ThreadStage;
  stage: string;
  stages: Array<ThreadStage>;
};

export const StagesMenu = (props: StagesMenuProps) => {
  const { selectedStage, stage, stages } = props;

  const popoverProps = usePopover();
  const navigate = useCommonNavigate();

  return (
    <ClickAwayListener onClickAway={() => popoverProps.setAnchorEl(null)}>
      {/* needs to be div instead of fragment so listener can work */}
      <div>
        <CWButton
          buttonType="mini-white"
          label={
            selectedStage
              ? `Stage: ${threadStageToLabel(selectedStage)}`
              : 'All Stages'
          }
          iconRight="chevronDown"
          onClick={popoverProps.handleInteraction}
        />
        <Popover
          content={
            <div className="threads-filter-menu-items">
              <ThreadsFilterMenuItem
                label="All Stages"
                isSelected={!stage}
                onClick={(e) => {
                  e.preventDefault();
                  app.threadUpdateEmmiter.emit('threadUpdated');
                  navigate('/discussions');
                }}
              />
              <CWDivider />
              {stages.map((targetStage, i) => (
                <ThreadsFilterMenuItem
                  key={i}
                  isSelected={stage === targetStage}
                  onClick={(e) => {
                    e.preventDefault();
                    app.threadUpdateEmmiter.emit('threadUpdated');
                    navigate(`/discussions?stage=${targetStage}`);
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
          {...popoverProps}
        />
      </div>
    </ClickAwayListener>
  );
};
