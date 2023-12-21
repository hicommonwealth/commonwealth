import AvatarsShowcase from 'views/pages/ComponentsShowcase/components/Avatars.showcase';
import ButtonsShowcase from 'views/pages/ComponentsShowcase/components/Buttons.showcase';
import CheckboxShowcase from 'views/pages/ComponentsShowcase/components/Checkbox.showcase';
import ElevationsShowcase from 'views/pages/ComponentsShowcase/components/Elevations.showcase';
import TooltipsShowcase from 'views/pages/ComponentsShowcase/components/Tooltips.showcase';

export const ComponentPageName = {
  Buttons: 'Buttons',
  Checkbox: 'Checkbox',
  Tooltips: 'Tooltips',
  Elevations: 'Elevations',
  Avatars: 'Avatars',
};

export const ComponentType = {
  Foundations: 'Foundations',
  Components: 'Components',
};

export const componentItems = [
  {
    ComponentPage: ButtonsShowcase,
    displayName: ComponentPageName.Buttons,
    type: ComponentType.Components,
  },
  {
    ComponentPage: CheckboxShowcase,
    displayName: ComponentPageName.Checkbox,
    type: ComponentType.Components,
  },
  {
    ComponentPage: TooltipsShowcase,
    displayName: ComponentPageName.Tooltips,
    type: ComponentType.Components,
  },
  {
    ComponentPage: ElevationsShowcase,
    displayName: ComponentPageName.Elevations,
    type: ComponentType.Foundations,
  },
  {
    ComponentPage: AvatarsShowcase,
    displayName: ComponentPageName.Avatars,
    type: ComponentType.Components,
  },
];
