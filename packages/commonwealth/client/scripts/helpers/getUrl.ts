import app from 'state';

export enum ServiceUrls {
  chainEvents = 'chain-events',
}

export function getBaseUrl(service?: ServiceUrls) {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    switch (service) {
      case ServiceUrls.chainEvents:
        return 'http://localhost:8081/api';
      default:
        return 'http://localhost:8080' + app.serverUrl();
    }
  } else {
    switch (service) {
      case ServiceUrls.chainEvents:
        return 'https://chain-events.herokuapp.com/api';
      default:
        // e.g. https://commonwealth.im/api
        return window.location.origin + app.serverUrl();
    }
  }
}

export async function getFetch(
  url: string,
  queryParams?: { [key: string]: any }
) {
  let queryUrl;
  if (queryParams) queryUrl = url + '?' + new URLSearchParams(queryParams);
  try {
    const response = await fetch(queryUrl || url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      const { result } = await response.json();
      return result;
    } else {
      console.error(`Fetch to ${queryUrl} failed, `, response);
    }
  } catch (e) {
    console.error(e);
  }
}
