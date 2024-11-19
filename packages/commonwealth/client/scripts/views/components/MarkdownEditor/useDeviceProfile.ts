export type DeviceProfile = 'mobile' | 'desktop';

export type DeviceOrientation = 'vertical' | 'horizontal';

function useDeviceOrientation(): DeviceOrientation {
  if (window.innerHeight > window.innerWidth) return 'vertical';
  else return 'horizontal';
}

/**
 * Depending on orientation, use the width/height to determine if we're mobile.
 */
function useDeviceCutoff() {
  const orientation = useDeviceOrientation();

  switch (orientation) {
    case 'vertical':
      return window.screen.width;
    case 'horizontal':
      return window.screen.height;
  }
}

const CUTOFF = 600;

/**
 *
 * Determine if we're a mobile device based just on the screen width.
 *
 * This is different from useBrowserWindow because we have to look at width
 * not innerWidth.
 */
export function useDeviceProfile(): DeviceProfile {
  const deviceCutoff = useDeviceCutoff();
  return deviceCutoff <= CUTOFF ? 'mobile' : 'desktop';
}
