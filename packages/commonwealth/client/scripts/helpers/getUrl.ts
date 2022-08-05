
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
        return 'https://www.commonwealth.chain-events.im'
      default:
        return 'https://www.commonwealth.im'
    }
  }
}
