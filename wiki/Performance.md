# Performance

## Reading Dev Tool Network Tab Numbers in Chrome
https://developer.chrome.com/docs/devtools/network/reference/?utm_source=devtools#timing-explanation

## Key ideas:
- caching
- database optimization
  - limit columns. 
  - proper indexing - faster query performance. 
- design (both frontend + backend) 
  - limit data

## Caching

### Consideration
- Invalidation scenarios
- Adhoc TTL/expirations
- Cache common app routes
- Cache common app config and validation data pulled out of DB eg. validateChain etc

## Database Optimization

### Consideration
- Limit columns pulled eg. if comments body not require, consider excluding it
- Proper Indexing for slow queries
- Slow read, delete & updates - redesign schema - to enable faster queries

## Design
  - redesign forum pages for performance
    - members. 
    - proposals. 
    - threads. 
  - pagination - it requires both frontend + backend changes

### Pagination

### Pagination Queries
- pagination by oldest first
- pagination by newest first
- pagination by recent activity or some other custom metric

### Consideration
- Limit Data - Pagination to common pages.  