import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';

import { NavigationButtonProps } from '../NavigationButton';

// This util receives a type of the navigation button
// and returns tuple, where first element is a (string) name of the icon
// and second element is a (string) display text visible below the icon
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
