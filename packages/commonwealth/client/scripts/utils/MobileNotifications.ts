import { execWithinMobileApp } from 'hooks/useReactNativeWebView';

export enum PermissionStatus {
  /**
   * User has granted the permission.
   */
  GRANTED = 'granted',
  /**
   * User hasn't granted or denied the permission yet.
   */
  UNDETERMINED = 'undetermined',
  /**
   * User has denied the permission.
   */
  DENIED = 'denied',
}

/**
 * Permission expiration time. Currently, all permissions are granted permanently.
 */
export type PermissionExpiration = 'never' | number;

/**
 * An object obtained by permissions get and request functions.
 */
export interface PermissionResponse {
  /**
   * Determines the status of the permission.
   */
  status: PermissionStatus;
}

export class MobileNotifications {
  public static async getPermissionsAsync(): Promise<PermissionResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await execWithinMobileApp<any, any>({
      type: 'Notifications.getPermissionsAsync',
    });

    console.log('response: ', response);

    return {
      status: response.status,
    };
  }

  public static async requestPermissionsAsync(): Promise<PermissionResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await execWithinMobileApp<any, any>({
      type: 'Notifications.requestPermissionsAsync',
    });

    console.log('response: ', response);

    return {
      status: response.status,
    };
  }
}
