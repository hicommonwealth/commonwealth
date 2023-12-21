import AvatarsShowcase from 'views/pages/ComponentsShowcase/components/Avatars.showcase';
import BannersAndAlertsShowcase from 'views/pages/ComponentsShowcase/components/BannersAndAlerts.showcase';

export const ComponentPageName = {
  Avatars: 'Avatars',
  BannersAndAlerts: 'BannersAndAlerts',
};

export const ComponentType = {
  Foundations: 'Foundations',
  Components: 'Components',
};

export const componentItems = [
  {
    ComponentPage: AvatarsShowcase,
    displayName: ComponentPageName.Avatars,
    type: ComponentType.Components,
  },
  {
    ComponentPage: BannersAndAlertsShowcase,
    displayName: ComponentPageName.BannersAndAlerts,
    type: ComponentType.Components,
  },
];
