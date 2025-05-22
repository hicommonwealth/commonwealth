/**
 * Typed message so that the react-native client knows how to handel this message.
 *
 * This is teh standard pattern of how to handle postMessage with multiple uses.
 */
export type TypedData<Data> = {
  type: string;
  data: Data;
};

export interface ReactNativeWebView {
  // allows us to send messages to ReactNative.
  postMessage: (message: string) => void;
}
