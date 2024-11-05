# Performance Benchmarks

## Contents

- [Core Web Performance Metrics](#core-web-performance-metrics)
- [Essential Performance Tools](#essential-performance-tools)
  * [Browser Network Tab: Chrome/Firefox/Safari](#browser-network-tab-chromefirefoxsafari)
    + [Geographic Performance Assessment: WebPageTest.org](#geographic-performance-assessment-webpagetestorg)
  * [Datadog Dashboards](#datadog-dashboards)
- [Change Log](#change-log)

## Core Web Performance Metrics

The performance of a website is key to its effective functionality and ensuring an exceptional user experience. Three critical performance metrics that have a substantial impact include:

1. **Page Load Time:** This refers to the time taken for a web page to completely load. A swift page load time often correlates with an improved user experience and enhanced user engagement.

2. **Time to First Byte (TTFB):** This metric calculates the duration from the moment a user initiates an HTTP request to the time the client's browser receives the first byte of information. A shorter TTFB typically signifies an efficient server response and strong network connectivity.

3. **First Contentful Paint (FCP):** FCP is the time elapsed from navigation until the first piece of content (text, images, etc.) appears on the screen. Lower FCP times can attract user attention faster and sustain their engagement.

It's crucial to test these metrics from various geographical locations as website performance can vary significantly based on factors such as server location, network latency, and local internet speeds. Evaluating performance metrics from different global regions guarantees a comprehensive understanding of user experiences and aids in fine-tuning the website for optimal performance worldwide.

## Essential Performance Tools

### Browser Network Tab: Chrome/Firefox/Safari

This is an indispensable tool for performance analysis, offering functions like cache disabling, traffic throttling, waterfall graph visualization, request/response analysis, and WebSocket traffic inspection. It also allows for the export of HAR files for future analysis and comparison.

Refer to the [Chrome DevTools Network Reference Guide](https://developer.chrome.com/docs/devtools/network/reference/) for more information.

#### Geographic Performance Assessment: WebPageTest.org

This tool enables performance testing from multiple global locations, providing insights into performance discrepancies based on geography. Key features include HAR file exports, result history storage, result sharing, and CDN setup and caching verification across various edge servers.

### Datadog Dashboards

_See also full [Datadog](./Datadog.md) entry._

We've implemented two new performance dashboards to monitor and track improvements in latency and call volume over time.

These dashboards serve a key role in prioritizing improvements by highlighting high call volume and slow endpoints. They are instrumental in monitoring the effect of improvements over time, as shown by specific examples corresponding to PRs like `getAddressProfile` larger batches and performance enhancements in backend API calls such as `/feed.GetUserActivity` and `/status`. Additionally, they can effectively detect abnormal spikes in latency and call volume through real-time metrics reported to Datadog.

## Change Log

- 240705: Abridged by Graham Johnson, removing outdated information (#8376).
- 230724: Authored by Nakul Manchanda.
