**Contents**
- [API Diagrams](#api-diagrams)
  * [Membership Check](#membership-check)
  * [User Performs Mutation Action](#user-performs-mutation-action)
  * [Create Group](#create-group)
  * [View Group Memberships](#view-group-memberships)
  * [Update/delete Group](#update-delete-group)
- [Change Log](#change-log)

# API Diagrams

## Membership Check

```mermaid
sequenceDiagram

  rect rgb(100, 100, 0)

  Note over Client: Lands on a community page, <br/> immediately checks membership <br/> status in background

  Client->>API: PUT /refresh-membership body: <br/> (jwt, chain, address, topic_id)

  Note over API: Checks membership status of address, <br/> for group(s), on specified topic. <br/> &nbsp <br /> If membership missing or stale, <br/> compute membership status, <br/> save and return membership <br/> &nbsp <br /> If membership fresh, <br/> return membership. <br/> &nbsp <br /> Membership model (saved to DB): <br/> &nbsp <br /> group_id: number <br/> address_id: number <br/> allowed: boolean <br/> reject_reason?: string <br/> last checked: Date

  API-->>Client: Response payload: <br/> &nbsp <br/> topic_id: number <br/> allowed: boolean <br/> reject_reason?: string

  Note over Client: If address not allowed on topic, <br/>  show banner with reject reason

  end
```

## User Performs Mutation Action

```mermaid
sequenceDiagram

  rect rgb(100, 0, 0)

  Note over Client: Attempts to perform gated action, <br/> (e.g. create thread, create comment)

  Client->>API: Request <br/> body: (jwt, chain, address, …data)

  Note over API: Checks membership status of address, <br/> for group(s), on thread's topic. <br/> &nbsp <br /> Always compute membership status and save. <br/> &nbsp <br /> If rejected, save Membership.reject_reason <br/> and throw unauthorized error <br/> &nbsp <br /> If allowed, proceed with action.

   alt Rejected
        API-->>Client: { error: <reject reason> }
    else Success
        API-->>Client: Normal response payload
    end

  end
```

## Create Group

```mermaid
sequenceDiagram

  rect rgb(0, 20, 0)

  Note over Client: Admin creates a Group

  Client->>API: POST /groups <br/> body: (jwt, chain_id, address, metadata, requirements, topics)

  Note over API: Validate schema. <br/> &nbsp <br/> Check limit of 20 groups per chain <br/> &nbsp <br/> Save group <br/> &nbsp <br/> Optionally add group to each specified topic

  API-->>Client: Response payload (Group): <br/> &nbsp <br/> id: number <br/> chain_id: string <br/> metadata: MetadataJSON <br/> requirements: RequirementsJSON

  end
```

## View Group Memberships

```mermaid
sequenceDiagram

  rect rgb(0, 0, 20)

  Note over Client: Admin views Group Memberships page

  Client ->> API: GET /groups?chain_id=XXX&members=true <br/>(no auth)

  Note over API: Gets all allowed memberships, <br/> for all groups, for all topics <br/> in the community. <br/> &nbsp <br/> No compute, only DB query. <br/> &nbsp <br/> Rejected memberships are not returned (?).

  API -->> Client: Response payload (Group w/ members): <br/> &nbsp <br/> id: number <br/> chain_id: string <br/> metadata: MetadataJSON <br/> requirements: RequirementsJSON <br/> members?: { <br/> group_id: number <br/> address_id: number <br/> allowed: true <br/> last checked: Date<br/>}[]

  end
```

## Update/delete Group

```mermaid
sequenceDiagram

  rect rgb(0, 0, 50)

  Note over Client: Admin updates/deletes Group

  Client ->> API: DELETE /groups/:id <br/> body: (jwt, chain_id, address)

  Note over API: Deletes all Memberships of the group, <br/> then updates/deletes the group

  API -->> Client: OK

  end
```

# Change Log

- 231023: Authored by Graham Johnson with initial API diagrams.