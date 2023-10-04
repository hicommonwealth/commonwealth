Requirements here are that:
1. actual routes in express app and published routes in published OAS specification math and are in sync. 
1. an easy way to add or remove routes from the express app and automatically have the OAS file updated. 
1. updated OAS file is then consumed by Swagger to update published API. 
1. ability to edit published API specification in Swagger UI, and reconcile with changes coming from code side. 
1. decision on whether we need to use Kong (or not.) 
1. decision on how to handle key issuance. 
1. decision on how to handle API traffic shaping. 

`swagger-express-ui` is a middleware for Express.js to test API endpoints using the Swagger (3.0) specification for defining the structure of our API.

`express-openapi-generator` is a code generator tool that creates a Express.js application, with routing layer and models, based on an OpenAPI 3.0 specification file. Unclear how we might use this library to keep our OAS specification up to date. 

