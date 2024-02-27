import AuthButtonsShowcase from 'views/pages/ComponentsShowcase/components/AuthButtons.showcase';
import AvatarsShowcase from 'views/pages/ComponentsShowcase/components/Avatars.showcase';
import BannersAndAlertsShowcase from 'views/pages/ComponentsShowcase/components/BannersAndAlerts.showcase';
import ButtonsShowcase from 'views/pages/ComponentsShowcase/components/Buttons.showcase';
import ButtonsIconShowcase from 'views/pages/ComponentsShowcase/components/ButtonsIcon.showcase';
import ColorsShowcase from 'views/pages/ComponentsShowcase/components/Colors.showcase';
import DividersShowcase from 'views/pages/ComponentsShowcase/components/Dividers.showcase';
import ElevationsShowcase from 'views/pages/ComponentsShowcase/components/Elevations.showcase';
import TypographyShowcase from 'views/pages/ComponentsShowcase/components/Typography.showcase';

export const ComponentPageName = {
  AuthButtons: 'AuthButtons',
  Avatars: 'Avatars',
  BannersAndAlerts: 'BannersAndAlerts',
  Colors: 'Colors',
  Typography: 'Typography',
  Elevations: 'Elevations',
  Dividers: 'Dividers',
  Buttons: 'Buttons',
  ButtonsIcon: 'ButtonsIcon',
};

export const ComponentType = {
  Foundations: 'Foundations',
  Components: 'Components',
};

export const componentItems = [
  {
    ComponentPage: AuthButtonsShowcase,
    displayName: ComponentPageName.AuthButtons,
    type: ComponentType.Components,
  },
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
  {
    ComponentPage: ColorsShowcase,
    displayName: ComponentPageName.Colors,
    type: ComponentType.Foundations,
  },
  {
    ComponentPage: TypographyShowcase,
    displayName: ComponentPageName.Typography,
    type: ComponentType.Foundations,
  },
  {
    ComponentPage: ElevationsShowcase,
    displayName: ComponentPageName.Elevations,
    type: ComponentType.Foundations,
  },
  {
    ComponentPage: DividersShowcase,
    displayName: ComponentPageName.Dividers,
    type: ComponentType.Foundations,
  },
  {
    ComponentPage: ButtonsShowcase,
    displayName: ComponentPageName.Buttons,
    type: ComponentType.Components,
  },
  {
    ComponentPage: ButtonsIconShowcase,
    displayName: ComponentPageName.ButtonsIcon,
    type: ComponentType.Components,
  },
];
