# Design Document

## Overview

This design implements fully generic and dynamic typing for request bodies and response data in the TanStack Auto Query API library. The solution uses TypeScript's advanced type inference capabilities combined with Zod schemas to provide complete type safety and IDE autocompletion without manual type casting.

The design extends the existing `EndpointConfig` type to support optional `bodySchema` and `querySchema` properties, and enhances type inference utilities to extract types from these schemas automatically.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Configuration                        │
│  (Endpoint Config with bodySchema, schema, querySchema)     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Type Inference Layer                            │
│  - InferBody: Extract body type from bodySchema             │
│  - InferResponse: Extract response type from schema         │
│  - InferQuery: Extract query params from querySchema        │
│  - ExtractParams: Extract path params from URL              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Hook Generation Layer                           │
│  - UseQueryHook: Typed GET requests                         │
│  - UseMutationHook: Typed POST/PUT/PATCH/DELETE             │
│  - MutationVariables: Typed params + body                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Generated API                                   │
│  - Fully typed hooks with autocompletion                    │
│  - Type-safe mutation variables                             │
│  - Type-safe response data                                  │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Configuration Phase**: User defines endpoint configuration with schemas
2. **Type Inference Phase**: TypeScript infers types from Zod schemas
3. **Hook Generation Phase**: Typed hooks are generated based on inferred types
4. **Usage Phase**: Developer uses hooks with full type safety and autocompletion

## Components and Interfaces

### 1. Enhanced EndpointConfig Type

**Location**: `src/types.ts`

**Purpose**: Extend the endpoint configuration to support body and query schemas

**Interface**:

```typescript
export type EndpointConfig = {
  method: HTTPMethod;
  path: string;
  schema?: z.ZodSchema; // Response schema (existing)
  bodySchema?: z.ZodSchema; // NEW: Request body schema
  querySchema?: z.ZodSchema; // NEW: Query parameters schema
};
```

**Design Decisions**:

- `bodySchema` is optional and only valid for POST/PUT/PATCH methods
- `querySchema` is optional and primarily used for GET requests
- Maintains backward compatibility by making new properties optional
- Uses Zod schemas for runtime validation and type inference

### 2. Enhanced Type Inference Utilities

**Location**: `src/types.ts`

**Purpose**: Provide advanced type inference from schemas

#### InferBody Enhancement

**Current Implementation**:

```typescript
export type InferBody<TEndpoint> = TEndpoint extends {
  method: "POST" | "PUT" | "PATCH";
}
  ? unknown
  : never;
```

**New Implementation**:

```typescript
export type InferBody<TEndpoint> = TEndpoint extends {
  method: "POST" | "PUT" | "PATCH";
}
  ? TEndpoint extends { bodySchema: z.ZodSchema<infer T> }
    ? T // Infer from bodySchema if provided
    : unknown // Fallback to unknown for backward compatibility
  : never; // Body not allowed for GET/DELETE
```

**Design Decisions**:

- Checks for `bodySchema` first to infer specific type
- Falls back to `unknown` if no schema provided (backward compatible)
- Returns `never` for methods that don't support bodies
- Uses Zod's type inference with `infer T`

#### InferQuery Type

**New Type**:

```typescript
export type InferQuery<TEndpoint> = TEndpoint extends {
  querySchema: z.ZodSchema<infer T>;
}
  ? T
  : Record<string, string | number | boolean | undefined>;
```

**Design Decisions**:

- Infers type from `querySchema` if provided
- Falls back to flexible record type for untyped queries
- Supports common query parameter types (string, number, boolean)
- Allows undefined for optional query parameters

### 3. Enhanced Hook Type Signatures

**Location**: `src/hooks/createHooks.ts`

**Purpose**: Generate fully typed hook signatures

#### UseQueryHook Enhancement

**New Implementation**:

```typescript
export type UseQueryHook<TEndpoint extends EndpointConfig> =
  // Case 1: Has path params AND query params
  ExtractParams<TEndpoint["path"]> extends Record<string, never>
    ? InferQuery<TEndpoint> extends Record<string, never>
      ? // No params, no query
        (
          options?: UseQueryOptions<InferResponse<TEndpoint>, Error>
        ) => UseQueryResult<InferResponse<TEndpoint>, Error>
      : // No params, has query
        (
          query: InferQuery<TEndpoint>,
          options?: UseQueryOptions<InferResponse<TEndpoint>, Error>
        ) => UseQueryResult<InferResponse<TEndpoint>, Error>
    : InferQuery<TEndpoint> extends Record<string, never>
    ? // Has params, no query
      (
        params: ExtractParams<TEndpoint["path"]>,
        options?: UseQueryOptions<InferResponse<TEndpoint>, Error>
      ) => UseQueryResult<InferResponse<TEndpoint>, Error>
    : // Has both params and query
      (
        params: ExtractParams<TEndpoint["path"]>,
        query: InferQuery<TEndpoint>,
        options?: UseQueryOptions<InferResponse<TEndpoint>, Error>
      ) => UseQueryResult<InferResponse<TEndpoint>, Error>;
```

**Design Decisions**:

- Handles all combinations of path params and query params
- Maintains clean API with positional parameters
- Preserves TanStack Query options parameter
- Fully typed response data

#### MutationVariables Enhancement

**New Implementation**:

```typescript
type MutationVariables<TEndpoint extends EndpointConfig> = ExtractParams<
  TEndpoint["path"]
> extends Record<string, never>
  ? InferBody<TEndpoint> extends never
    ? void // No params, no body (e.g., POST /logout)
    : InferBody<TEndpoint> extends unknown
    ? { body?: unknown } // No params, untyped body
    : { body: InferBody<TEndpoint> } // No params, typed body
  : InferBody<TEndpoint> extends never
  ? { params: ExtractParams<TEndpoint["path"]> } // Has params, no body
  : InferBody<TEndpoint> extends unknown
  ? {
      // Has params, untyped body
      params: ExtractParams<TEndpoint["path"]>;
      body?: unknown;
    }
  : {
      // Has params, typed body
      params: ExtractParams<TEndpoint["path"]>;
      body: InferBody<TEndpoint>;
    };
```

**Design Decisions**:

- Handles all combinations of path params and body
- Makes body required when `bodySchema` is provided
- Makes body optional when no schema (backward compatible)
- Properly types both params and body simultaneously
- Uses `void` for mutations with no params or body

### 4. Enhanced Fetcher Function

**Location**: `src/fetch/createFetcher.ts`

**Purpose**: Support query parameters in requests

**Enhancement**:

```typescript
export type FetchOptions<TBody = unknown, TQuery = unknown> = {
  method: string;
  body?: TBody;
  params?: Record<string, string | number>; // Path params
  query?: TQuery; // NEW: Query parameters
  signal?: AbortSignal;
  schema?: z.ZodSchema;
  bodySchema?: z.ZodSchema; // NEW: For validation
};
```

**Implementation Changes**:

- Add query parameter serialization to URL
- Validate request body against `bodySchema` if provided
- Maintain existing path parameter substitution
- Preserve all existing functionality

## Data Models

### Configuration Example

```typescript
import { createQueryAPI } from "tanstack-api-generator";
import { z } from "zod";

// Define schemas
const UserFilterSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  page: z.number().optional(),
});

const CreateUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0),
});

const UserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  age: z.number(),
  createdAt: z.string(),
});

// Create API with full typing
export const api = createQueryAPI({
  users: {
    list: {
      method: "GET",
      path: "/users",
      querySchema: UserFilterSchema, // Query params typed
      schema: z.array(UserResponseSchema), // Response typed
    },
    get: {
      method: "GET",
      path: "/users/:id",
      schema: UserResponseSchema, // Response typed
    },
    create: {
      method: "POST",
      path: "/users",
      bodySchema: CreateUserSchema, // Request body typed
      schema: UserResponseSchema, // Response typed
    },
    update: {
      method: "PUT",
      path: "/users/:id",
      bodySchema: CreateUserSchema, // Request body typed
      schema: UserResponseSchema, // Response typed
    },
  },
} as const);

// Export inferred types
export type UserFilter = z.infer<typeof UserFilterSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type User = z.infer<typeof UserResponseSchema>;
```

### Usage Example

```typescript
import { api } from "./api";

function UserList() {
  // Query with typed query parameters
  const { data: users } = api.users.list.useQuery({
    name: "John", // ✅ Typed and autocompleted
    page: 1, // ✅ Typed and autocompleted
    // invalid: true  // ❌ TypeScript error: property doesn't exist
  });

  // Mutation with typed body
  const { mutate: createUser } = api.users.create.useMutation();

  createUser({
    body: {
      name: "John Doe", // ✅ Typed and autocompleted
      email: "john@example.com", // ✅ Typed and autocompleted
      age: 30, // ✅ Typed and autocompleted
      // invalid: true  // ❌ TypeScript error: property doesn't exist
    },
  });

  // Mutation with params and body
  const { mutate: updateUser } = api.users.update.useMutation();

  updateUser({
    params: { id: "123" }, // ✅ Typed from path
    body: {
      name: "Jane Doe", // ✅ Typed from bodySchema
      email: "jane@example.com",
      age: 25,
    },
  });

  // Response data is fully typed
  return (
    <div>
      {users?.map((user) => (
        <div key={user.id}>
          {user.name} {/* ✅ Autocompleted */}
          {user.email} {/* ✅ Autocompleted */}
          {/* {user.invalid}  ❌ TypeScript error */}
        </div>
      ))}
    </div>
  );
}
```

## Error Handling

### Type-Level Error Handling

**Scenario 1: Invalid Body Property**

```typescript
createUser({
  body: {
    name: "John",
    invalidProp: true, // ❌ Error: Object literal may only specify known properties
  },
});
```

**Scenario 2: Missing Required Property**

```typescript
createUser({
  body: {
    name: "John",
    // ❌ Error: Property 'email' is missing in type
  },
});
```

**Scenario 3: Wrong Type**

```typescript
createUser({
  body: {
    name: "John",
    email: "john@example.com",
    age: "30", // ❌ Error: Type 'string' is not assignable to type 'number'
  },
});
```

**Scenario 4: Body on GET Request**

```typescript
// This is prevented at the type level
const config = {
  users: {
    list: {
      method: "GET",
      bodySchema: UserSchema, // ❌ TypeScript error: bodySchema not allowed for GET
    },
  },
};
```

### Runtime Validation

**Zod Schema Validation**:

- Request bodies are validated against `bodySchema` before sending
- Validation errors throw descriptive error messages
- Response data is validated against `schema` after receiving
- Validation errors are caught and reported through TanStack Query error handling

## Testing Strategy

### Unit Tests

**Type Inference Tests** (`src/types.test.ts`):

```typescript
describe("Type Inference", () => {
  it("should infer body type from bodySchema", () => {
    type Config = {
      method: "POST";
      bodySchema: z.ZodObject<{ name: z.ZodString }>;
    };
    type Body = InferBody<Config>;
    // Assert: Body should be { name: string }
  });

  it("should infer query type from querySchema", () => {
    type Config = {
      method: "GET";
      querySchema: z.ZodObject<{ page: z.ZodNumber }>;
    };
    type Query = InferQuery<Config>;
    // Assert: Query should be { page: number }
  });
});
```

**Hook Generation Tests** (`src/hooks/createHooks.test.ts`):

```typescript
describe("Hook Generation", () => {
  it("should generate typed mutation hook with bodySchema", () => {
    const config = {
      users: {
        create: {
          method: "POST",
          path: "/users",
          bodySchema: z.object({ name: z.string() }),
          schema: z.object({ id: z.string(), name: z.string() }),
        },
      },
    } as const;

    const api = createQueryAPI(config);

    // Type assertion tests
    const { mutate } = api.users.create.useMutation();
    mutate({ body: { name: "John" } }); // Should compile
  });
});
```

### Integration Tests

**End-to-End Type Safety** (`tests/integration/typing.test.tsx`):

```typescript
describe("Full Type Safety", () => {
  it("should provide autocompletion for request body", () => {
    const { mutate } = api.users.create.useMutation();

    // This should compile with full autocompletion
    mutate({
      body: {
        name: "John",
        email: "john@example.com",
        age: 30,
      },
    });
  });

  it("should provide autocompletion for response data", () => {
    const { data } = api.users.get.useQuery({ id: "123" });

    // This should compile with full autocompletion
    const name = data?.name;
    const email = data?.email;
  });
});
```

### Type-Level Tests

**TypeScript Compilation Tests** (`tests/types/compilation.test.ts`):

```typescript
// These tests verify that TypeScript compilation fails as expected

// @ts-expect-error - Should fail: invalid property
api.users.create.useMutation().mutate({
  body: { invalidProp: true },
});

// @ts-expect-error - Should fail: missing required property
api.users.create.useMutation().mutate({
  body: { name: "John" },
});

// @ts-expect-error - Should fail: wrong type
api.users.create.useMutation().mutate({
  body: { name: "John", email: "john@example.com", age: "30" },
});
```

## Migration Strategy

### Backward Compatibility

**Existing Code Continues to Work**:

```typescript
// Old configuration (still works)
const api = createQueryAPI({
  users: {
    create: {
      method: "POST",
      path: "/users",
      schema: UserSchema, // Only response schema
    },
  },
});

// Body is typed as unknown (requires manual casting)
const { mutate } = api.users.create.useMutation();
mutate({ body: userData as CreateUser });
```

**New Code Gets Full Typing**:

```typescript
// New configuration (enhanced)
const api = createQueryAPI({
  users: {
    create: {
      method: "POST",
      path: "/users",
      bodySchema: CreateUserSchema, // NEW: Request body schema
      schema: UserSchema, // Response schema
    },
  },
});

// Body is fully typed (no casting needed)
const { mutate } = api.users.create.useMutation();
mutate({
  body: {
    name: "John", // ✅ Autocompleted
    email: "john@example.com", // ✅ Autocompleted
  },
});
```

### Migration Guide

**Step 1**: Add body schemas to existing endpoints

```typescript
// Before
create: {
  method: "POST",
  path: "/users",
  schema: UserSchema,
}

// After
create: {
  method: "POST",
  path: "/users",
  bodySchema: CreateUserSchema,  // Add this
  schema: UserSchema,
}
```

**Step 2**: Remove manual type casts

```typescript
// Before
mutate({ body: userData as CreateUser });

// After
mutate({ body: userData }); // Fully typed!
```

**Step 3**: Add query schemas for GET endpoints (optional)

```typescript
// Before
list: {
  method: "GET",
  path: "/users",
  schema: z.array(UserSchema),
}

// After
list: {
  method: "GET",
  path: "/users",
  querySchema: UserFilterSchema,  // Add this
  schema: z.array(UserSchema),
}
```

## Performance Considerations

### Type Inference Performance

- All type inference happens at compile time
- No runtime overhead for type checking
- TypeScript compiler handles all type computations
- Generated JavaScript is identical to current implementation

### Bundle Size Impact

- No additional runtime code for type inference
- Zod schemas are already included (no new dependency)
- Type definitions don't affect bundle size
- Zero impact on production bundle

### Development Experience

- TypeScript compilation time may increase slightly for large APIs
- IDE autocompletion response time remains fast
- Type checking provides immediate feedback
- Overall developer productivity increases significantly

## Security Considerations

### Input Validation

- Request bodies are validated against `bodySchema` before sending
- Prevents sending malformed data to API
- Zod validation catches type mismatches at runtime
- Validation errors are thrown before network request

### Response Validation

- Response data is validated against `schema` after receiving
- Protects against unexpected API responses
- Type mismatches are caught and reported
- Application state remains type-safe

### Type Safety Benefits

- Prevents common security issues (SQL injection via type confusion)
- Ensures data conforms to expected structure
- Catches potential XSS vectors through type validation
- Provides defense-in-depth through compile-time and runtime checks
