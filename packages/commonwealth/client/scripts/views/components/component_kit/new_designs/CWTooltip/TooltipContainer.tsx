import { Placement } from '@popperjs/core/lib';
import React, { FC } from 'react';
import useSidebarStore from 'state/ui/sidebar';
import { getClasses } from 'views/components/component_kit/helpers';
import { ComponentType } from 'views/components/component_kit/types';

type ContainerProps = {
  placement: Placement;
  children: React.ReactNode;
};

export const TooltipContainer: FC<ContainerProps> = ({
  placement,
  children,
}) => {
  const { menuVisible } = useSidebarStore();

  return (
    <div className={getClasses({ placement }, ComponentType.Tooltip)}>
      {children}
      <div
        className={getClasses(
          {
            placement,
            Arrow: true,
            tipTop: placement === 'top',
            tipBottomSidebarHidden: placement === 'bottom' && !menuVisible,
            tipRight: placement === 'right',
            tipBottom: placement === 'bottom',
            tipLeft: placement === 'left',
          },
          ComponentType.Tooltip,
        )}
      />
    </div>
  );
};
