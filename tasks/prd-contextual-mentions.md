# Product Requirements Document: Contextual Mentions Feature

## Introduction/Overview

This feature will enable users to mention various platform entities (Users, Topics, Threads, Communities, Proposals) within text editors using different denotation characters. The system will provide contextual information about mentioned entities to AI systems for generating more relevant and informed responses.

The feature introduces a multi-entity mention system where:
- `@` triggers global multi-entity search across all entity types
- `#` provides specific Topic search  
- `!` provides specific Thread search
- `~` provides specific Community search

When entities are mentioned, their contextual data is dynamically fetched and provided to AI systems to enhance response quality and relevance.

## Goals

1. **Enhanced User Experience**: Provide intuitive entity mentioning with visual type indicators and comprehensive search across platform entities
2. **Improved AI Context**: Supply AI systems with rich contextual information about mentioned entities to generate more relevant responses
3. **Flexible Search**: Enable both global and entity-specific search functionality through different denotation characters
4. **Consistent Integration**: Implement mention functionality across all major text editors in the platform
5. **Configurable Limits**: Build system with configurable parameters for easy adjustment of search results, mention limits, and data recency

## User Stories

1. **As a user creating a thread**, I want to mention specific topics using `#TopicName` so that the AI can provide responses relevant to that topic's context and recent discussions.

2. **As a user writing a comment**, I want to use `@` to search across all entity types (users, communities, topics, threads, proposals) so that I can quickly find and mention any relevant platform entity.

3. **As a user replying to a comment**, I want to mention specific community discussions using `!ThreadTitle` so that the AI can reference that thread's content and comments in its response.

4. **As a user in any text editor**, I want to see visual indicators (emojis) for different entity types in search results so that I can easily distinguish between users, topics, threads, communities, and proposals.

5. **As a user mentioning entities**, I want the AI to have access to contextual information about my mentions (user activity, topic discussions, thread content) so that its responses are more informed and relevant.

6. **As a user**, I want to mention communities from across the platform using `~CommunityName` so that the AI can provide context about those communities in its responses.

## Functional Requirements

### 1. Multi-Character Mention System
1.1. The system must support four denotation characters:
   - `@`: Global multi-entity search (Users, Topics, Threads, Communities, Proposals)
   - `#`: Topic-specific search within current community
   - `!`: Thread-specific search within current community  
   - `~`: Community-specific search across all communities

1.2. Search results must display in priority order: Users → Communities → Topics → Threads → Proposals

1.3. Search results must be limited to 10 items by default (configurable in code)

1.4. Empty search results must display appropriate placeholder text

### 2. Visual Entity Identification
2.1. Each entity type must display a unique emoji indicator in search results:
   - Users: 👤 (configurable for Phosphor icons)
   - Communities: 🏘️ (configurable for Phosphor icons)
   - Topics: 🏷️ (configurable for Phosphor icons) 
   - Threads: 💬 (configurable for Phosphor icons)
   - Proposals: 📋 (configurable for Phosphor icons)

2.2. Deleted entities must display with ❌ emoji indicator

2.3. Final rendered mentions must maintain current visual styling with added emoji type indicators

### 3. Search Scope and Permissions
3.1. Users can mention all communities via `~` search
3.2. Users can only mention threads, topics, and users from within their current community via `#` and `!` searches
3.3. Private/gated content must not appear in search results
3.4. Global `@` search must respect community-specific permissions for threads and topics

### 4. Mention Formatting and Insertion
4.1. Selected mentions must be inserted with correct specific denotation format regardless of search method:
   - User found via `@` → `[@UserName](user:userId)`
   - Topic found via `@` → `[#TopicName](topic:topicId)`
   - Thread found via `@` → `[!ThreadTitle](thread:threadId)`
   - Community found via `@` → `[~CommunityName](community:communityId)`
   - Proposal found via `@` → `[ProposalTitle](proposal:proposalId)`

4.2. Direct entity searches must use their respective formats:
   - `#` search → `[#TopicName](topic:topicId)`
   - `!` search → `[!ThreadTitle](thread:threadId)`
   - `~` search → `[~CommunityName](community:communityId)`

### 5. Context Aggregation for AI
5.1. System must extract mention identifiers from editor content before AI submission
5.2. Maximum of 3 entities can be mentioned per post/comment (configurable in code)
5.3. Context data must be fetched from the last 30 days (configurable in code)
5.4. Context must include:
   - **Users**: Bio, recent comments (last 3), community activity
   - **Topics**: Description, recent threads, active discussions
   - **Threads**: Title, content, recent comments
   - **Communities**: Description, recent activity, member count
   - **Proposals**: Title, description, current status, voting results

### 6. Backend API Requirements
6.1. `POST /api/ai/aggregate-context` endpoint must accept mention identifiers and return formatted context strings
6.2. `GET /api/users/{userId}/comments?limit=3&sortBy=createdAt:desc` endpoint must return recent user comments
6.3. Search API must support `SearchScope.Topics` and `SearchScope.All` with entity type indicators
6.4. AI completion endpoint must accept and inject contextual prompts into system prompts

### 7. Editor Integration
7.1. Mention functionality must work in:
   - StickyInput.tsx
   - NewThreadForm.tsx  
   - CommentEditor.tsx
7.2. All editors must support the same mention syntax and behavior
7.3. Typeahead dropdown must appear consistently across all editors

## Non-Goals (Out of Scope)

1. **User Privacy Controls**: No option for users to disable AI context collection from their mentions
2. **Token Limit Management**: No automatic token counting or context truncation based on model limits
3. **Cross-Platform Integration**: No mention functionality in mobile apps or external integrations
4. **Advanced Permissions**: No granular permission controls for who can mention what entities
5. **Mention Analytics**: No tracking or analytics on mention usage patterns
6. **Batch Context Processing**: No background processing of mention context - all processing happens synchronously
7. **Mention Notifications**: No notification system for when users/entities are mentioned

## Technical Considerations

### Client-Side Architecture
- Extend existing `use_mention.tsx` hook with multi-character support
- Create new `useMentionExtractor.ts` hook for parsing mention identifiers
- Update Quill editor configuration for multiple denotation characters
- Modify AI completion flow to include context aggregation step

### Backend Architecture  
- Implement context aggregation service for fetching entity data
- Extend search API to handle multi-entity queries with type indicators
- Add mention context injection to AI prompt system
- Ensure proper caching for frequently mentioned entities

### Configuration Management
- All limits (result count, mention count, data recency) should be configurable constants
- Entity type emojis should be easily replaceable with icon system
- Search priority order should be configurable array

### Performance Considerations
- Implement debounced search to avoid excessive API calls
- Cache search results for common queries
- Optimize context aggregation queries to prevent slowdowns
- Consider implementing mention context pre-loading for active entities

## Success Metrics

While specific KPIs are not defined, the feature's success can be measured through:
- Mention adoption rate across different entity types
- AI response quality improvements when contextual mentions are present
- User engagement with the mention search functionality
- Reduction in follow-up questions when relevant entities are mentioned

## Open Questions

1. Should mention context be cached to improve performance for frequently mentioned entities?
2. How should the system handle mentions of entities that become private after being mentioned?
3. Should there be rate limiting on context aggregation requests to prevent abuse?
4. What fallback behavior should occur if context aggregation fails during AI request? 