var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }

    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }

      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }

      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }

      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
import { createRequestUrl } from './createRequestUrl';
import { getFetchFn } from './getFetchFn';
import { getRequestBody } from './getRequestBody';
import { getResponseBody } from './getResponseBody';
import { makeRequest } from './makeRequest';
import { requestWithRetries } from './requestWithRetries';

export function fetcherImpl(args) {
  return __awaiter(this, void 0, void 0, function* () {
    const headers = {};
    if (args.body !== undefined && args.contentType != null) {
      headers['Content-Type'] = args.contentType;
    }
    if (args.headers != null) {
      for (const [key, value] of Object.entries(args.headers)) {
        if (value != null) {
          headers[key] = value;
        }
      }
    }
    const url = createRequestUrl(args.url, args.queryParameters);
    let requestBody = yield getRequestBody({
      body: args.body,
      type: args.requestType === 'json' ? 'json' : 'other',
    });
    const fetchFn = yield getFetchFn();
    try {
      const response = yield requestWithRetries(
        () =>
          __awaiter(this, void 0, void 0, function* () {
            return makeRequest(
              fetchFn,
              url,
              args.method,
              headers,
              requestBody,
              args.timeoutMs,
              args.abortSignal,
              args.withCredentials,
              args.duplex,
            );
          }),
        args.maxRetries,
      );
      let responseBody = yield getResponseBody(response, args.responseType);
      if (response.status >= 200 && response.status < 400) {
        return {
          ok: true,
          body: responseBody,
          headers: response.headers,
        };
      } else {
        return {
          ok: false,
          error: {
            reason: 'status-code',
            statusCode: response.status,
            body: responseBody,
          },
        };
      }
    } catch (error) {
      if (args.abortSignal != null && args.abortSignal.aborted) {
        return {
          ok: false,
          error: {
            reason: 'unknown',
            errorMessage: 'The user aborted a request',
          },
        };
      } else if (error instanceof Error && error.name === 'AbortError') {
        return {
          ok: false,
          error: {
            reason: 'timeout',
          },
        };
      } else if (error instanceof Error) {
        return {
          ok: false,
          error: {
            reason: 'unknown',
            errorMessage: error.message,
          },
        };
      }
      return {
        ok: false,
        error: {
          reason: 'unknown',
          errorMessage: JSON.stringify(error),
        },
      };
    }
  });
}

export const fetcher = fetcherImpl;
