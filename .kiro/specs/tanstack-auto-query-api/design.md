# Design Document

## Overview

The @tanstack-auto/query-api package is a TypeScript-first code generation library that transforms declarative API configurations into fully-typed TanStack Query hooks and utilities. The system uses advanced TypeScript features (template literal types, conditional types, and mapped types) to provide complete type inference from configuration to generated hooks. The architecture follows a functional composition pattern where small, focused utilities combine to create the final API object.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     createQueryAPI()                         │
│                   (Main Entry Point)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Configuration Parser                        │
│  - Validates endpoint definitions                            │
│  - Extracts path parameters                                  │
│  - Determines HTTP method types                              │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Fetch     │  │    Query    │  │    Hook     │
│   Wrapper   │  │  Key Factory│  │  Generator  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
           ┌────────────────────────┐
           │   Generated API Object │
           │  - useQuery hooks      │
           │  - useMutation hooks   │
           │  - Query keys          │
           │  - Invalidation utils  │
           └────────────────────────┘
```

### Core Components

1. **createQueryAPI**: Main factory function that orchestrates all components
2. **Fetch Wrapper**: HTTP client with interceptor support
3. **Query Key Factory**: Generates deterministic, hierarchical query keys
4. **Hook Generator**: Creates typed useQuery/useMutation hooks
5. **Type Inference Engine**: TypeScript utilities for extracting types from configuration
6. **Invalidation Engine**: Manages automatic query cache invalidation

## Components and Interfaces

### 1. Configuration Types

```typescript
// Base endpoint configuration
type EndpointConfig = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  schema?: z.ZodSchema; // Optional Zod validation
};

// API configuration structure (nested groups)
type APIConfig = {
  [group: string]:
    | {
        [endpoint: string]: EndpointConfig;
      }
    | EndpointConfig;
};

// Example usage
const config = {
  users: {
    list: { method: "GET", path: "/users" },
    get: { method: "GET", path: "/users/:id" },
    create: { method: "POST", path: "/users" },
    update: { method: "PUT", path: "/users/:id" },
    delete: { method: "DELETE", path: "/users/:id" },
  },
  posts: {
    list: { method: "GET", path: "/posts" },
    get: { method: "GET", path: "/posts/:id" },
  },
} as const;
```

### 2. Fetch Wrapper

```typescript
type FetchConfig = {
  baseURL?: string;
  headers?: Record<string, string>;
  beforeRequest?: (config: RequestInit) => RequestInit | Promise<RequestInit>;
  afterResponse?: (response: Response) => Response | Promise<Response>;
};

type FetcherFunction = <TResponse = unknown, TBody = unknown>(
  path: string,
  options?: {
    method: string;
    body?: TBody;
    params?: Record<string, string | number>;
    signal?: AbortSignal;
  }
) => Promise<TResponse>;

// Implementation approach:
// - Create a configured fetch function with interceptors
// - Handle path parameter replacement
// - Automatic JSON serialization/deserialization
// - Error mapping to structured format
```

### 3. Query Key Factory

```typescript
// Query key structure follows TanStack Query v5 standards
// Example: ['users', 'list'] or ['users', 'get', { id: '123' }]

type QueryKeyFactory<TConfig extends APIConfig> = {
  [Group in keyof TConfig]: {
    [Endpoint in keyof TConfig[Group]]: {
      key: (
        params?: ExtractParams<TConfig[Group][Endpoint]["path"]>
      ) => readonly unknown[];
    };
  };
};

// Implementation approach:
// - Parse path template to extract parameter names
// - Generate hierarchical keys: [group, endpoint, params]
// - Ensure deterministic ordering of parameter keys
// - Support partial keys for invalidation (e.g., ['users'] invalidates all user queries)
```

### 4. Hook Generator

```typescript
// Generated hooks based on HTTP method
type GeneratedHooks<TConfig extends APIConfig> = {
  [Group in keyof TConfig]: {
    [Endpoint in keyof TConfig[Group]]: TConfig[Group][Endpoint]["method"] extends "GET"
      ? UseQueryHook<TConfig[Group][Endpoint]>
      : UseMutationHook<TConfig[Group][Endpoint]>;
  };
};

// UseQuery hook signature
type UseQueryHook<TEndpoint> = (
  params: ExtractParams<TEndpoint["path"]>,
  options?: UseQueryOptions<InferResponse<TEndpoint>>
) => UseQueryResult<InferResponse<TEndpoint>>;

// UseMutation hook signature
type UseMutationHook<TEndpoint> = (
  options?: UseMutationOptions<
    InferResponse<TEndpoint>,
    Error,
    { params: ExtractParams<TEndpoint["path"]>; body?: InferBody<TEndpoint> }
  >
) => UseMutationResult<InferResponse<TEndpoint>>;

// Implementation approach:
// - Wrap TanStack Query's useQuery/useMutation
// - Inject fetcher function with correct path and method
// - Automatically generate query keys
// - Add onSuccess callbacks for automatic invalidation
```

### 5. Type Inference System

```typescript
// Extract path parameters from template string
type ExtractParams<TPath extends string> =
  TPath extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractParams<`/${Rest}`>]: string | number }
    : TPath extends `${infer _Start}:${infer Param}`
    ? { [K in Param]: string | number }
    : never;

// Infer response type from Zod schema or generic
type InferResponse<TEndpoint> = TEndpoint extends {
  schema: z.ZodSchema<infer T>;
}
  ? T
  : unknown;

// Infer request body type
type InferBody<TEndpoint> = TEndpoint extends {
  method: "POST" | "PUT" | "PATCH";
}
  ? unknown
  : never;
```

### 6. Invalidation Engine

```typescript
type InvalidationUtils<TConfig extends APIConfig> = {
  [Group in keyof TConfig]: {
    invalidate: {
      all: () => Promise<void>;
      [Endpoint in keyof TConfig[Group]]: (
        params?: ExtractParams<TConfig[Group][Endpoint]['path']>
      ) => Promise<void>;
    };
  };
};

// Implementation approach:
// - Use queryClient.invalidateQueries() with key prefixes
// - Automatic invalidation on mutation success
// - Manual invalidation utilities for each endpoint
// - Support for invalidating entire groups
```

## Data Models

### Generated API Object Structure

```typescript
const api = createQueryAPI(config, fetchConfig);

// Structure:
api = {
  users: {
    list: {
      useQuery: (params, options) => UseQueryResult,
      key: (params) => QueryKey,
    },
    get: {
      useQuery: (params, options) => UseQueryResult,
      key: (params) => QueryKey,
    },
    create: {
      useMutation: (options) => UseMutationResult,
      key: (params) => QueryKey,
    },
    update: {
      useMutation: (options) => UseMutationResult,
      key: (params) => QueryKey,
    },
    delete: {
      useMutation: (options) => UseMutationResult,
      key: (params) => QueryKey,
    },
    invalidate: {
      all: () => Promise<void>,
      list: (params) => Promise<void>,
      get: (params) => Promise<void>,
      // ... etc
    },
  },
  posts: {
    // ... similar structure
  },
};
```

### Internal Data Flow

1. **Configuration Input** → Parser validates and extracts metadata
2. **Endpoint Metadata** → Type inference extracts params, body, response types
3. **Hook Creation** → Generator wraps TanStack Query hooks with fetcher
4. **Query Key Generation** → Factory creates deterministic keys from metadata
5. **Invalidation Setup** → Engine configures automatic cache updates
6. **API Object Output** → All utilities combined into typed object

## Error Handling

### Error Types

```typescript
type APIError = {
  status: number;
  statusText: string;
  message: string;
  data?: unknown;
};

type ValidationError = {
  type: "validation";
  errors: z.ZodError;
};
```

### Error Handling Strategy

1. **Network Errors**: Caught by fetch wrapper, mapped to APIError
2. **HTTP Errors**: Status codes 4xx/5xx mapped to APIError with response data
3. **Validation Errors**: Zod validation failures throw ValidationError
4. **Type Errors**: Caught at compile time via TypeScript
5. **Configuration Errors**: Throw descriptive errors during createQueryAPI call

### Error Propagation

- Fetch wrapper catches and transforms errors
- TanStack Query handles error states in hooks
- Validation errors thrown before data reaches hooks
- All errors typed for proper TypeScript handling

## Testing Strategy

### Unit Tests

1. **Type Inference Utilities**

   - Test ExtractParams with various path templates
   - Test InferResponse with and without schemas
   - Test type constraints and edge cases

2. **Query Key Factory**

   - Test deterministic key generation
   - Test parameter inclusion in keys
   - Test hierarchical key structure

3. **Fetch Wrapper**

   - Test path parameter replacement
   - Test interceptor execution order
   - Test error mapping
   - Test JSON serialization

4. **Hook Generator**

   - Test correct hook type (useQuery vs useMutation)
   - Test parameter passing to fetcher
   - Test query key generation

5. **Invalidation Engine**
   - Test automatic invalidation on mutations
   - Test manual invalidation utilities
   - Test group-level invalidation

### Integration Tests

1. **End-to-End API Generation**

   - Create API from config
   - Verify all endpoints generated
   - Test hook execution with mock server

2. **Type Safety**

   - Compile-time tests using TypeScript
   - Test that invalid configs fail compilation
   - Test parameter type enforcement

3. **TanStack Query Integration**
   - Test with real QueryClient
   - Test cache behavior
   - Test invalidation effects

### Testing Tools

- **Vitest**: Primary test runner
- **@testing-library/react**: For hook testing
- **MSW (Mock Service Worker)**: For API mocking
- **tsd**: For TypeScript type testing

## Implementation Notes

### TypeScript Configuration

- Target ES2020+ for modern features
- Strict mode enabled
- Declaration files generated for consumers
- Source maps for debugging

### Dependencies

- **Peer Dependencies**:

  - @tanstack/react-query: ^5.0.0
  - react: ^18.0.0
  - zod: ^3.0.0 (optional)

- **Dev Dependencies**:
  - typescript
  - vitest
  - @testing-library/react
  - msw

### Package Structure

```
@tanstack-auto/query-api/
├── src/
│   ├── index.ts                 # Main export
│   ├── createQueryAPI.ts        # Factory function
│   ├── types.ts                 # Type definitions
│   ├── fetch/
│   │   ├── createFetcher.ts     # Fetch wrapper
│   │   └── interceptors.ts      # Interceptor utilities
│   ├── keys/
│   │   ├── createKeyFactory.ts  # Query key generation
│   │   └── parseParams.ts       # Path parameter parsing
│   ├── hooks/
│   │   ├── createHooks.ts       # Hook generator
│   │   └── inferTypes.ts        # Type inference utilities
│   └── invalidation/
│       └── createInvalidation.ts # Invalidation engine
├── tests/
│   ├── unit/
│   └── integration/
└── package.json
```

### Performance Considerations

- Query key generation should be memoized
- Fetch wrapper should reuse configuration
- Type inference happens at compile time (zero runtime cost)
- Minimal runtime overhead beyond TanStack Query itself

### Future Enhancements

- Support for GraphQL endpoints
- Built-in retry strategies
- Request deduplication
- Optimistic updates helpers
- SSR support utilities
