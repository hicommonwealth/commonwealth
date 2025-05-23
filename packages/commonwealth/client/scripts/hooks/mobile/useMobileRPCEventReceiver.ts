import { useCallback } from 'react';
import { useReactNativeWebView } from '../useReactNativeWebView';

const ENABLE_TRACE = false;

type EvenSubscribeMessage = {
  $id: string;
  type: string;
  variant: 'event-subscribe';
  eventName: string;
};

type EventUpdateMessage<EventData> = {
  $id: string;
  type: string;
  variant: 'event-update';
  data: EventData;
};

export function useMobileRPCEventReceiver<EventData>(type: string) {
  const reactNativeWebView = useReactNativeWebView();

  return useCallback(
    (eventName: string, listener: (update: EventData) => void) => {
      const $id = '' + Math.random() * 100000;

      const subscription: EvenSubscribeMessage = {
        $id,
        type: type,
        eventName,
        variant: 'event-subscribe',
      };

      if (!reactNativeWebView) {
        return;
      }

      reactNativeWebView.postMessage(JSON.stringify(subscription));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function handler(message: MessageEvent<any>) {
        const eventUpdateMessage = toEventUpdateMessage<EventData>(
          type,
          message.data,
        );

        if (eventUpdateMessage?.$id === $id) {
          if (ENABLE_TRACE) {
            console.log('Got event update: ', eventUpdateMessage);
          }
          listener(eventUpdateMessage.data);
        }
      }

      window.addEventListener('message', handler);
    },
    [reactNativeWebView, type],
  );
}

function toEventUpdateMessage<EventData>(
  type: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
): EventUpdateMessage<EventData> | null {
  const obj = messageToObject(data);

  if (obj && obj.type === type && obj.variant === 'event-update') {
    return obj;
  }

  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function messageToObject(message: string | any): any | null {
  if (message === 'string') {
    try {
      return JSON.parse(message);
    } catch (e) {
      // this might be just a string sent with sendMessage
      return null;
    }
  }

  return typeof message === 'string' ? JSON.parse(message) : message;
}
