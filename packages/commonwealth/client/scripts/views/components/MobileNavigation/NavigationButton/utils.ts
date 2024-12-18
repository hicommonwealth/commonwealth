import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';
import { NavigationButtonType } from './NavigationButton';

export const typeToIconAndName = (
  type: NavigationButtonType,
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
