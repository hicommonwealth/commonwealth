import { isMobileApp } from 'hooks/useReactNativeWebView';
import { MobileNotifications } from 'utils/MobileNotifications';

export async function verifyMobileNotificationPermissions(): Promise<boolean> {
  if (isMobileApp()) {
    const existingPermissions = await MobileNotifications.getPermissionsAsync();

    if (existingPermissions.status === 'granted') {
      // we already have the permissions we need
      return true;
    }

    console.log(
      'Requesting permissions due to existing permissions: ',
      existingPermissions.status,
    );

    const newPermissions = await MobileNotifications.requestPermissionsAsync();

    console.log('Permissions are now ' + newPermissions.status);

    return newPermissions.status === 'granted';
  }

  return true;
}
