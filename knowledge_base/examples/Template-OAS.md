# Template OAS

```yml
openapi: 3.0.0
info:
  title: Community Contract Template API
  version: I 0.0.1
servers:
  - url: https://api.common.xyz/v1
paths:
  /communitycontracttemplate:
    post:
      operationId: createCommunityContractTemplate
      summary: Creates a new instance of a Community Contract Template
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CommunityContractTemplate'
      responses:
        201:
          description: Community Contract Template created successfully
        400:
          description: Bad Request
  /template:
    post:
      operationId: createTemplate
      summary: Creates a new instance of a Template
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Template'
      responses:
        201:
          description: Template created successfully
        400:
          description: Bad Request
    get:
      operationId: getTemplates
      summary: Retrieves all templates associated with an ABI
      parameters:
        - name: abi
          in: query
          required: true
          schema:
            type: string
      responses:
        200:
          description: Templates retrieved successfully
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Template'
  /communitycontracttemplate/{communityContractTemplateId}:
    put:
      operationId: updateCommunityContractTemplate
      summary: Updates a Community Contract Template
      parameters:
        - name: communityContractTemplateId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateCommunityContractTemplate'
      responses:
        200:
          description: Community Contract Template updated successfully
        400:
          description: Bad Request
    delete:
      operationId: deleteCommunityContractTemplate
      summary: Deletes a Community Contract Template
      parameters:
        - name: communityContractTemplateId
          in: path
          required: true
          schema:
            type: string
      responses:
        204:
          description: Community Contract Template deleted successfully
        404:
          description: Community Contract Template not found
  /template/{templateId}:
    delete:
      operationId: deleteTemplate
      summary: Deletes a Template
      parameters:
        - name: templateId
          in: path
          required: true
          schema:
            type: string
      responses:
        204:
          description: Template deleted successfully
        404:
          description: Template not found
components:
  schemas:
    CommunityContractTemplate:
      type: object
      properties:
        abi:
          type: string
        cctmd:
          type: string
      required:
        - abi
        - cctmd
    Template:
      type: object
      properties:
```

## Change Log

- 231013: Flagged by Graham Johnson for certification.
- 230204: Authored by Forest Mars.
