import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';

import { NavigationButtonProps } from '../NavigationButton';

export const typeToIconAndName = (
  type: NavigationButtonProps['type'],
): [IconName, string] => {
  switch (type) {
    case 'home':
      return ['house', 'Home'];
    case 'create':
      return ['plusCirclePhosphor', 'Create'];
    case 'explore':
      return ['compassPhosphor', 'Explore'];
    case 'notifications':
      return ['bell', 'Notifications'];
  }
};
