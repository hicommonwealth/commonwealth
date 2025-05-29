## Relevant Files

- `packages/commonwealth/client/scripts/views/components/react_quill_editor/use_mention.tsx` - Core mention hook that needs extension for multi-entity support
- `packages/commonwealth/client/scripts/views/components/react_quill_editor/use_mention.test.tsx` - Unit tests for mention hook
- `packages/commonwealth/client/scripts/views/components/react_quill_editor/mention-config.ts` - New configuration file for mention system constants
- `packages/commonwealth/client/scripts/hooks/useMentionExtractor.ts` - New hook for parsing mention identifiers from editor content
- `packages/commonwealth/client/scripts/hooks/useMentionExtractor.test.ts` - Unit tests for mention extractor
- `packages/commonwealth/client/scripts/models/SearchQuery.ts` - Search API query definitions needing extension
- `packages/commonwealth/client/scripts/state/api/search/useUnifiedSearch.ts` - New client-side hook for unified search API
- `libs/model/src/aggregates/search/SearchEntities.query.ts` - New unified search query supporting all entity types
- `libs/model/src/aggregates/search/index.ts` - Search aggregate index file
- `libs/model/src/index.ts` - Main model index updated to include Search aggregate
- `libs/adapters/src/trpc/types.ts` - TRPC types updated to include Search tag
- `packages/commonwealth/server/api/search.ts` - New search API router
- `packages/commonwealth/server/api/internal-router.ts` - Internal router updated to include search API
- `packages/commonwealth/server/routes/ai/aggregateContext.ts` - New endpoint for context aggregation
- `packages/commonwealth/server/routing/router.ts` - Main router updated to include context aggregation endpoint
- `packages/commonwealth/client/scripts/state/api/search/searchQuery.ts` - Search API query definitions needing extension
- `packages/commonwealth/server/routes/search.ts` - Backend search endpoint requiring multi-entity support
- `packages/commonwealth/server/routes/ai/aggregateContext.test.ts` - Unit tests for context aggregation
- `packages/commonwealth/client/scripts/state/api/ai/useAiCompletion.ts` - AI completion hook needing context integration
- `packages/commonwealth/server/routes/ai/aiCompletionHandler.ts` - Backend AI handler needing context injection
- `packages/commonwealth/client/scripts/views/components/StickEditorContainer/StickyInput/StickyInput.tsx` - Editor component requiring mention integration
- `packages/commonwealth/client/scripts/views/components/NewThreadFormLegacy/NewThreadForm.tsx` - Editor component requiring mention integration
- `packages/commonwealth/client/scripts/views/components/Comments/CommentEditor/CommentEditor.tsx` - Editor component requiring mention integration

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Extend Mention System for Multi-Entity Support
  - [x] 1.1 Create configuration constants for mention entities and characters
  - [x] 1.2 Add "Topics" to SearchScope enum
  - [x] 1.3 Extend mention hook to support multiple denotation characters (@, #, !, ~)
  - [x] 1.4 Add entity type indicators and visual formatting
  - [x] 1.5 Update search logic to handle different entity types
  - [x] 1.6 Implement dynamic insertion formatting based on entity type
  - [x] 1.7 Add unit tests for extended mention functionality
- [x] 2.0 Implement Search API Extensions
  - [x] 2.1 Create unified search query that supports multiple entity types with type indicators
  - [x] 2.2 Add search for Topics entity type (included in unified query)
  - [x] 2.3 Create unified search API endpoint that combines all entity searches
  - [x] 2.4 Update client-side search hook to use the new unified API
- [x] 3.0 Create Context Aggregation System
  - [x] 3.1 Create useMentionExtractor hook to parse mention identifiers from editor content
  - [x] 3.2 Create backend endpoint POST /api/ai/aggregate-context
  - [x] 3.3 Implement context fetching logic for each entity type (Users, Topics, Threads, Communities, Proposals)
  - [x] 3.4 Register context aggregation endpoint in server routing
- [x] 4.0 Integrate AI Context Pipeline
  - [x] 4.1 Extend useAiCompletion hook with context aggregation integration
  - [x] 4.2 Add mention extraction and context fetching to AI completion flow
  - [x] 4.3 Implement enhanced system prompt injection with contextual information
  - [x] 4.4 Add graceful error handling for context aggregation failures
  - [x] 4.5 Update AI completion handler to log contextual mention usage
  - [x] 4.6 Create comprehensive unit tests for context integration
- [x] 5.0 Update Editor Components for Mention Integration 
  - [x] 5.1 Update StickyInput component to support contextual mentions in AI generation
  - [x] 5.2 Update NewThreadForm component to include contextual mentions in AI thread generation
  - [x] 5.3 Update CommentEditor component to include contextual mentions in AI comment generation
  - [x] 5.4 Update editor component prop interfaces to include communityId parameter
  - [x] 5.5 Update all editor component usage sites to pass communityId where available
  - [x] 5.6 Ensure mention system works consistently across StickyInput, NewThreadForm, and CommentEditor
