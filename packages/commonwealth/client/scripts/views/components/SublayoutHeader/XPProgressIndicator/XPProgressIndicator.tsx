import React from 'react';

import ClickAwayListener from '@mui/base/ClickAwayListener';
import clsx from 'clsx';
import useUserStore from 'state/ui/user';
import { CWText } from '../../component_kit/cw_text';
import CWPopover, {
  usePopover,
} from '../../component_kit/new_designs/CWPopover';
import TaskList from './TaskList';
import WeeklyProgressGoal from './WeeklyProgressGoal';
import './XPProgressIndicator.scss';
import { XPProgressIndicatorMode, XPProgressIndicatorProps } from './types';

const XPProgressIndicator = ({
  mode = XPProgressIndicatorMode.Detailed,
  className,
}: XPProgressIndicatorProps) => {
  const sampleData = {
    weeklyGoal: {
      current: 170,
      target: 400,
    },
  };

  const user = useUserStore();

  const popoverProps = usePopover();

  if (!user.isLoggedIn) return;

  return (
    <ClickAwayListener onClickAway={() => popoverProps.setAnchorEl(null)}>
      <>
        <button
          className={clsx('XPProgressIndicator', className, mode)}
          onClick={popoverProps.handleInteraction}
        >
          {mode === XPProgressIndicatorMode.Compact ? (
            <CWText type="b2" fontWeight="semiBold">
              XP
            </CWText>
          ) : (
            <WeeklyProgressGoal
              progress={{
                current: sampleData.weeklyGoal.current,
                target: sampleData.weeklyGoal.target,
              }}
            />
          )}
        </button>
        <CWPopover
          content={<TaskList />}
          placement="bottom"
          {...popoverProps}
        />
      </>
    </ClickAwayListener>
  );
};

export default XPProgressIndicator;
