import { useBooleanFlagValue } from '@openfeature/react-sdk';
import { AvailableFeatureFlag } from '../helpers/feature-flags';

export const useFlag = (name: AvailableFeatureFlag): boolean => {
  return (
    useBooleanFlagValue(name, false, {
      updateOnConfigurationChanged: false,
    }) ?? false
  );
};
