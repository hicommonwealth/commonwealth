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

/**
 * Basic type representing a function to call with an id for the response and a
 * name for the function.
 */
type MessageWithResponseID = {};

class Latch<T> {
  promise: Promise<T>;
  resolve!: (value: T | PromiseLike<T>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const __requestID = Math.random() * 100000;

  const latch = new Latch<Output>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function messageToObject(message: string | object): any {
    return typeof message === 'string' ? JSON.parse(message) : message;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handler(message: MessageEvent<any>) {
    const dataObj = messageToObject(message.data);

    if (dataObj.__requestID === __requestID) {
      latch.resolve(dataObj as Output);
    }
  }

  addEventListener('message', handler);

  window.ReactNativeWebView!.postMessage(
    JSON.stringify({
      ...input,
      __requestID,
    }),
  );

  // the event listener we just registered will keep listening until the
  // latch is revolved and gets the response.
  await latch.promise;

  // now we have to remove the event listener before we return the latch and
  // clean up after ourselves.
  removeEventListener('message', handler);

  return latch.promise;
}
