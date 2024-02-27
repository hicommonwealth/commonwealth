import AuthButtonsShowcase from 'views/pages/ComponentsShowcase/components/AuthButtons.showcase';
import AvatarsShowcase from 'views/pages/ComponentsShowcase/components/Avatars.showcase';
import BannersAndAlertsShowcase from 'views/pages/ComponentsShowcase/components/BannersAndAlerts.showcase';
import ButtonsShowcase from 'views/pages/ComponentsShowcase/components/Buttons.showcase';
import ButtonsCircleShowcase from 'views/pages/ComponentsShowcase/components/ButtonsCircle.showcase';
import ButtonsIconShowcase from 'views/pages/ComponentsShowcase/components/ButtonsIcon.showcase';
import ColorsShowcase from 'views/pages/ComponentsShowcase/components/Colors.showcase';
import DividersShowcase from 'views/pages/ComponentsShowcase/components/Dividers.showcase';
import DrawersShowcase from 'views/pages/ComponentsShowcase/components/Drawers.showcase';
import ElevationsShowcase from 'views/pages/ComponentsShowcase/components/Elevations.showcase';
import RadioButtonsShowcase from 'views/pages/ComponentsShowcase/components/RadioButtons.showcase';
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
  ButtonsCircle: 'ButtonsCircle',
  RadioButtons: 'RadioButtons',
  Drawers: 'Drawers',
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
  {
    ComponentPage: ButtonsCircleShowcase,
    displayName: ComponentPageName.ButtonsCircle,
    type: ComponentType.Components,
  },
  {
    ComponentPage: RadioButtonsShowcase,
    displayName: ComponentPageName.RadioButtons,
    type: ComponentType.Components,
  },
  {
    ComponentPage: DrawersShowcase,
    displayName: ComponentPageName.Drawers,
    type: ComponentType.Components,
  },
];
