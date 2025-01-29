export interface ReactNativeWebView {
  // allows us to send messages to ReactNative.
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
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

type MessageWithResponseID = {
  id: string;
  type: string;
};

class Latch<T> {
  promise: Promise<T>;
  resolve!: (value: T | PromiseLike<T>) => void;
  reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise<T>((res, rej) => {
      this.resolve = res;
      this.reject = rej;
    });
  }
}

/**
 * Execute a function within the mobile app, then wait for a response.
 *
 * @param input
 */
export async function execWithinMobileApp<
  Input extends MessageWithResponseID,
  Output,
>(input: Input): Promise<Output> {
  if (!isMobileApp()) {
    throw new Error('Not within mobile app');
  }

  const latch = new Latch<Output>();

  function handler(message: MessageEvent<any>) {
    if (message.data.id === input.id) {
      latch.resolve(message.data as Output);
    }
  }

  addEventListener('message', handler);

  window.ReactNativeWebView!.postMessage(JSON.stringify(input));

  // the event listener we just registered will keep listening until the
  // latch is revolved and gets the response.
  await latch.promise;

  // now we have to remove the event listener before we return the latch and
  // clean up after ourselves.
  removeEventListener('message', handler);

  return latch.promise;
}
