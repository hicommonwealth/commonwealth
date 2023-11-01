# Content Delivery Network (CDN)

## Functionality

CDNs enhance website performance by using servers that are geographically closest to the visitor. These servers respond to the request, reducing data travel distance and thus improving the website's loading speed. CDNs also cache content at the network edge, which decreases bandwidth costs and safeguards websites against traffic surges and Distributed Denial of Service (DDoS) attacks. CDNs are particularly beneficial for large, global websites, ensuring speedy website load times irrespective of the user's location.

## Cloudflare as a CDN

Cloudflare operates as a CDN by globally distributing content. It also offers a comprehensive DNS service.

## Configurations and Features

### Edge Cache TTL (Time to Live)

Increasing Edge Cache TTL instructs Cloudflare's edge servers to store your content for longer periods. This setting can be tailored for individual URLs using Page Rules, or more generally for your entire website.

### Polish: Serving WebP Images and Compressing Images on the Fly

Cloudflare's Polish feature optimizes images. When enabled, it applies either lossless or lossy compression to images and can convert them to the WebP format if the browser supports it. WebP, a modern image format, provides superior compression for web images, resulting in smaller file sizes and faster load times for users.

## DNS Configurations and Features

### Subdomains and CNAME Records

Subdomains, which are domains within a larger domain, can be created and directed to different IP addresses or servers using DNS records. A CNAME record, for instance, could point "m.example.com" to another server like "mobile.example.com," where a mobile-friendly version of your website resides.

### Redirects and Page Rules

DNS records, such as URL redirect records, can automatically redirect traffic from one domain to another. Cloudflare's Page Rules feature enables URL forwarding, providing control over how Cloudflare functions on a URL or subdomain basis.

### Load Balancing and Geo DNS Routing

By using multiple A or AAAA records for the same domain, DNS can distribute traffic across various servers, effectively balancing the load. Additionally, origin servers can be created and Geo DNS load balancing can be used to route requests to the geographically closest server.

## Areas of Improvement

### Parallel Loading

To overcome the limitation of six TCP connections per origin for HTTP 1 and 1.1, subdomains can be treated as different origins. Different subdomains can be configured in Cloudflare DNS for various aspects such as images, application bundles, and API calls.

### Increase Edge TTL Limits

Increasing the Edge TTL limit can improve caching performance, especially for content that doesn't frequently change. Ensuring a cache status of HIT is desirable, whereas statuses like EXPIRED or RE-VALIDATED are not optimal.

### Serving Images and Application Bundles via CDN

Currently, images account for approximately 60% of all data downloads. Creating a new subdomain for serving images, and potentially another for application bundles, can parallelize loading and further improve performance.

## Change Log

- 230714: Authored by Nakul Manchanda.
