
export enum ServiceUrls {
  chainEvents = 'chain-events'
}

export function getBaseUrl(service?: ServiceUrls) {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    switch (service) {
      case ServiceUrls.chainEvents:
        return 'http://localhost:8081';
      default:
        return 'http://localhost:8080';
    }
  } else {
    switch (service) {
      case ServiceUrls.chainEvents:
        return 'https://chain-events.herokuapp.com'
      default:
        return 'https://www.commonwealth.im'
    }
  }
}

export async function getFetch(url: string, queryParams?: { [key: string]: any }) {
  let queryUrl;
  if (queryParams) queryUrl = url + '?' + new URLSearchParams(queryParams);
  try {
    const response = await fetch(queryUrl || url, {
      method: 'GET',
      mode: 'no-cors',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      referrerPolicy: 'strict-origin-when-cross-origin',
    })
    if (response.ok) {
      const {result} = await response.json();
      return result;
    }
    else console.error(response)
  } catch (e) {
    console.error(e);
  }
}
