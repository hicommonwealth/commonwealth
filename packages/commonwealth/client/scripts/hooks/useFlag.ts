import { AvailableFeatureFlag } from '../helpers/feature-flags';
import { useBooleanFlagValue } from './openFeature/useFeatureFlag';

export const useFlag = (name: AvailableFeatureFlag) => {
  return useBooleanFlagValue(name, false, {
    updateOnConfigurationChanged: false,
  });
};
