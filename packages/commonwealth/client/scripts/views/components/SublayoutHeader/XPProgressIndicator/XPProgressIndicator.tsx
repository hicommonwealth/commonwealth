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
import useXPProgress from './useXPProgress';

const XPProgressIndicator = ({
  mode = XPProgressIndicatorMode.Detailed,
  className,
}: XPProgressIndicatorProps) => {
  const { weeklyGoal } = useXPProgress();

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
                current: weeklyGoal.current,
                target: weeklyGoal.target,
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
