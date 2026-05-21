import { useBooleanFlagValue } from '@openfeature/react-sdk';
import { AvailableFeatureFlag } from 'shared/utils/feature-flags';

export const useFlag = (name: AvailableFeatureFlag): boolean => {
  return (
    useBooleanFlagValue(name, false, {
      updateOnConfigurationChanged: false,
    }) ?? false
  );
};
