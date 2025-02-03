export interface ReactNativeWebView {
  // allows us to send messages to ReactNative.
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
    // @ts-expect-error: duplicate declaration
    ReactNativeWebView?: ReactNativeWebView;
  }
}

/**
 * Types aren't defined for ReactNativeWebView so we define them.
 *
 * Also, we return undefined if it's not present to detect that you're running
 * within a regular browser.
 */
export function useReactNativeWebView(): ReactNativeWebView | undefined {
  if (window.ReactNativeWebView) {
    return window.ReactNativeWebView;
  }

  return undefined;
}

export function isMobileApp(): boolean {
  return !!window.ReactNativeWebView;
}
