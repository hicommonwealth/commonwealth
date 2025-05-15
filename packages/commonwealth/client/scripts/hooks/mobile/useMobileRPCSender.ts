import { useCallback } from 'react';

type ProtoError = {
  message: string;
};

type ProtoRequestObject<Request> = {
  $id: string;
  type: string;
  variant: 'request';
  data: Request;
};

type ProtoResponseObjectSuccess<Response> = {
  $id: string;
  type: string;
  variant: 'response';
  data: Response;
  error: null;
};

/**
 * Wraps a response so that it includes the error OR data.
 */
type ProtoResponseObjectFailure = {
  $id: string;
  type: string;
  variant: 'response';
  data: null;
  error: ProtoError;
};

type ProtoResponseObject<Response> =
  | ProtoResponseObjectSuccess<Response>
  | ProtoResponseObjectFailure;

type Opts = {
  type: string;
};

export function useMobileRPCSender<Request, Response>(opts: Opts) {
  return useCallback(
    async (request: Request) => {
      return new Promise<Response>((resolve, reject) => {
        const $id = '' + Math.random() * 100000;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function handler(message: MessageEvent<any>) {
          const protoResponse = toProtoResponse<Response>(
            opts.type,
            message.data,
          );

          if (protoResponse?.$id === $id) {
            console.log(
              'Got proto response: ',
              JSON.stringify(protoResponse, null, 2),
            );

            if (protoResponse.error) {
              reject(protoResponse.error);
            } else {
              resolve(protoResponse.data);
            }
          }
        }

        window.addEventListener('message', handler);

        const protoRequest: ProtoRequestObject<Request> = {
          $id,
          type: opts.type,
          variant: 'request',
          data: request,
        };

        window.ReactNativeWebView!.postMessage(JSON.stringify(protoRequest));
      });
    },
    [opts.type],
  );
}

function toProtoResponse<Response>(
  type: string,
  data: any,
): ProtoResponseObject<Response> | null {
  const obj = messageToObject(data);

  if (obj && obj.type === type && obj.variant === 'response') {
    return obj;
  }

  return null;
}

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
