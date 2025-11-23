# RFC: Runtime Type-Safe React Query Hook Generator

## Summary

This RFC proposes adding support for a runtime, type-safe React Query hook generator to the TanStack Query ecosystem. Unlike traditional code generation tools, this approach uses a typed configuration object to automatically generate fully-typed React Query hooks at runtime, eliminating boilerplate while maintaining zero runtime overhead beyond TanStack Query itself.

The proposal is based on a working open-source implementation published as the package `tanstack-api-generator`, which has been battle-tested in production environments.

## Problem Statement

Building React Query hooks for large or evolving APIs requires repetitive, manual work:

- Writing repetitive boilerplate for queries and mutations (useQuery/useMutation wrappers)
- Manually creating and maintaining query keys following TanStack Query v5 standards
- Implementing consistent invalidation logic across mutations
- Manually maintaining types, paths, and request/response shapes
- Duplicating patterns across teams or services
- High risk of inconsistencies and type drift when backend schemas change
- No runtime validation of API responses

There is currently no official or recommended way to:

- Automatically generate typed React Query hooks from a configuration
- Standardize query key generation following TanStack Query v5 hierarchical patterns
- Implement automatic query invalidation on mutations
- Ensure runtime type safety with schema validation
- Maintain consistency across projects using TanStack Query

## Proposed Solution

Introduce an official or community-supported runtime React Query hook generator that:

- Accepts a typed configuration object defining API endpoints
- Generates fully typed React Query hooks at runtime (no build step required)
- Automatically creates hierarchical query keys following TanStack Query v5 standards
- Implements automatic query invalidation on mutations (POST invalidates lists, PUT/PATCH/DELETE invalidate lists and specific items)
- Provides runtime validation with Zod schemas (optional)
- Supports request/response interceptors for authentication and logging
- Maintains complete TypeScript type inference from configuration to hooks
- Has zero runtime overhead beyond TanStack Query itself

Key differentiator: This is NOT a code generation tool. It's a runtime library that uses TypeScript's type system to provide full type safety without generating files.

A working implementation exists as the community package `tanstack-api-generator`.

## Motivation

A runtime hook generator improves the developer experience:

- Eliminates repetitive hook creation and query key management
- Ensures type-safe bindings between backend schema and frontend with full TypeScript inference
- Accelerates development for large or evolving APIs (no build step, instant feedback)
- Simplifies onboarding for teams adopting React Query (define API once, get hooks automatically)
- Creates predictable and standardized codebases following TanStack Query v5 best practices
- Reduces long-term maintenance burden (single source of truth for API definition)
- Provides runtime validation to catch API contract violations
- Automatic invalidation logic reduces bugs and improves cache consistency

Projects using TanStack Query at scale would benefit immediately from an official solution that standardizes patterns and reduces boilerplate.

## Key Features

### 1. Zero Boilerplate

Define your API once, get fully-typed hooks automatically:

```typescript
const api = createQueryAPI({
  users: {
    list: { method: "GET", path: "/users" },
    get: { method: "GET", path: "/users/:id" },
  },
} as const);

// Use immediately - no code generation needed
const { data } = api.users.list.useQuery();
```

### 2. Automatic Query Keys

Query keys follow TanStack Query v5 hierarchical standards automatically:

```typescript
api.users.list.key(); // ['users', 'list']
api.users.get.key({ id: "123" }); // ['users', 'get', { id: '123' }]
```

### 3. Automatic Invalidation

Mutations automatically invalidate related queries based on HTTP semantics:

```typescript
// POST invalidates list queries
api.users.create.useMutation(); // Invalidates api.users.list

// PUT/PATCH invalidates list and specific item
api.users.update.useMutation(); // Invalidates api.users.list and api.users.get

// DELETE invalidates list and specific item
api.users.delete.useMutation(); // Invalidates api.users.list and api.users.get
```

### 4. Full Type Safety

Complete TypeScript inference from configuration to hooks:

```typescript
const api = createQueryAPI({
  users: {
    get: { method: "GET", path: "/users/:id", schema: UserSchema },
    create: {
      method: "POST",
      path: "/users",
      bodySchema: CreateUserSchema,
      schema: UserSchema,
    },
  },
} as const);

// Path parameters are typed
api.users.get.useQuery({ id: "123" }); // ✅
api.users.get.useQuery({ userId: "123" }); // ❌ TypeScript error

// Request bodies are typed
api.users.create
  .useMutation()
  .mutate({ body: { name: "John", email: "john@example.com" } }); // ✅
api.users.create.useMutation().mutate({ body: { invalid: true } }); // ❌ TypeScript error

// Responses are typed
const { data } = api.users.get.useQuery({ id: "123" });
// data is typed as { id: string; name: string; email: string }
```

### 5. Runtime Validation

Optional Zod integration for runtime type safety:

```typescript
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

const api = createQueryAPI({
  users: {
    get: { method: "GET", path: "/users/:id", schema: UserSchema },
  },
} as const);

// Automatically validates API responses against schema
// Throws error if response doesn't match schema
```

### 6. Request/Response Interceptors

Add authentication, logging, or custom headers easily:

```typescript
const api = createQueryAPI(config, {
  baseURL: "https://api.example.com",
  beforeRequest: async (config) => {
    const token = await getAuthToken();
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  },
  afterResponse: async (response) => {
    if (response.status === 401) {
      // Handle auth errors globally
      redirectToLogin();
    }
    return response;
  },
});
```

## Detailed Proposal

### Input

The library accepts a typed configuration object with:

- API endpoint definitions grouped logically
- HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Path templates with parameter extraction (e.g., `/users/:id`)
- Optional Zod schemas for response validation and type inference
- Optional Zod schemas for request body validation and type inference
- Optional Zod schemas for query parameter validation and type inference

**Example configuration:**

```typescript
import { createQueryAPI } from "tanstack-api-generator";
import { z } from "zod";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const api = createQueryAPI(
  {
    users: {
      list: {
        method: "GET",
        path: "/users",
        schema: z.array(UserSchema), // Response type inference
      },
      get: {
        method: "GET",
        path: "/users/:id",
        schema: UserSchema,
      },
      create: {
        method: "POST",
        path: "/users",
        bodySchema: CreateUserSchema, // Request body type inference
        schema: UserSchema,
      },
      update: {
        method: "PUT",
        path: "/users/:id",
        bodySchema: CreateUserSchema.partial(),
        schema: UserSchema,
      },
      delete: {
        method: "DELETE",
        path: "/users/:id",
      },
    },
  } as const, // Required for type inference
  {
    baseURL: "https://api.example.com",
  }
);
```

### Output

For each endpoint, the library provides at runtime:

- Fully typed React Query hooks (useQuery for GET, useMutation for POST/PUT/PATCH/DELETE)
- Query key factory functions following TanStack Query v5 hierarchical standards
- Automatic query invalidation on mutations
- Manual invalidation utilities
- Complete TypeScript type inference for parameters, bodies, and responses

**Example usage:**

```typescript
// GET requests become useQuery hooks with full type inference
function UserList() {
  const { data: users, isLoading } = api.users.list.useQuery();
  // users is typed as Array<{ id: string; name: string; email: string }>

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// Path parameters are automatically extracted and typed
function UserDetail({ userId }: { userId: string }) {
  const { data: user } = api.users.get.useQuery({ id: userId });
  // TypeScript enforces { id: string } parameter

  return <div>{user?.name}</div>;
}

// POST/PUT/PATCH/DELETE become useMutation hooks
function CreateUser() {
  const createUser = api.users.create.useMutation();
  // Automatically invalidates api.users.list on success

  const handleSubmit = (name: string, email: string) => {
    createUser.mutate({
      body: { name, email }, // Fully typed from bodySchema
    });
  };

  return (
    <button onClick={() => handleSubmit("John", "john@example.com")}>
      Create User
    </button>
  );
}

// Query keys are automatically generated
const listKey = api.users.list.key(); // ['users', 'list']
const getKey = api.users.get.key({ id: "123" }); // ['users', 'get', { id: '123' }]

// Manual invalidation utilities
await api.users.invalidate.list();
await api.users.invalidate.get({ id: "123" });
await api.users.invalidate.all(); // Invalidate entire group
```

All hooks follow TanStack Query v5 best practices:

- Hierarchical query keys: `[group, endpoint, params]`
- Deterministic key ordering for consistent caching
- Automatic invalidation based on HTTP method semantics
- Full TypeScript inference without code generation

### API Design Goals

- Zero runtime overhead beyond TanStack Query itself
- Fully type-safe with complete TypeScript inference
- No build step or code generation required
- Optional Zod integration for runtime validation
- Support for request/response interceptors (authentication, logging)
- Automatic query invalidation following REST semantics
- Works with any fetch-compatible API
- Minimal configuration required (baseURL is optional)

## Alternatives Considered

1. **Manual creation of React Query hooks** - Repetitive, error-prone, inconsistent patterns across teams

2. **Build-time code generation (OpenAPI, GraphQL codegen)** - Requires build step, generates files that clutter the codebase, harder to customize

3. **Generic code generators not tailored to TanStack Query** - Don't follow TanStack Query v5 best practices, no automatic invalidation

4. **In-house tools created separately by each team** - Duplicate effort, inconsistent implementations, no community support

5. **tRPC** - Excellent but requires backend to be TypeScript, not suitable for REST APIs or third-party APIs

The runtime approach offers the best balance: full type safety without code generation, instant feedback, minimal configuration, and follows TanStack Query best practices out of the box.

## Open Questions

- Should this be an official TanStack package, a community extension, or documented pattern?
- Should Zod be a peer dependency or remain optional?
- Should the library support other validation libraries (Yup, io-ts, etc.)?
- Should infinite queries be supported in addition to regular queries?
- What's the preferred approach for handling authentication tokens (interceptors vs. custom fetcher)?
- Should the library provide built-in retry logic or rely on TanStack Query's defaults?
- How should the library handle file uploads and FormData?

## Prior Art / Prototype

**Package:** `tanstack-api-generator`

**Description:** Production-ready runtime library that generates typed React Query hooks, mutation hooks, query keys, and invalidation utilities from a typed configuration object. Features include:

- Complete TypeScript type inference using conditional types and template literals
- Automatic query key generation following TanStack Query v5 hierarchical standards
- Automatic query invalidation based on HTTP method semantics
- Optional Zod integration for runtime validation
- Request/response interceptors for authentication and logging
- Support for path parameters, query parameters, and request bodies
- Zero runtime overhead beyond TanStack Query itself
- No build step or code generation required

**Current Status:**

- Published on NPM with MIT license
- Battle-tested in production environments
- Comprehensive test suite with unit and E2E tests
- Full documentation with examples
- TypeScript 5.0+ support

This RFC proposes evolving this concept into an official or community-endorsed solution aligned with TanStack architecture and standards.

- **Repository:** https://github.com/kossidom/tanstack-api-generator
- **NPM:** https://www.npmjs.com/package/tanstack-api-generator

## Conclusion

A runtime hook generator for TanStack Query would:

- Eliminate boilerplate for queries, mutations, and query keys
- Improve type safety with full TypeScript inference from configuration to hooks
- Accelerate onboarding by providing a single source of truth for API definitions
- Increase consistency by standardizing query keys and invalidation patterns
- Reduce bugs through automatic invalidation and optional runtime validation
- Provide a maintainable workflow for API integration without code generation

The runtime approach offers unique advantages over traditional code generation:

- No build step required - instant feedback during development
- No generated files cluttering the codebase
- Easy to customize through interceptors and configuration
- Works seamlessly with hot module replacement

This RFC proposes formalizing such a tool and aligning the final design with TanStack maintainers' expectations for quality, extensibility, and best practices.

## Request for Feedback

Feedback requested on:

- Alignment with TanStack Query's goals and philosophy
- Preferred scope for an official solution (core package, official plugin, or community-endorsed tool)
- Validation library strategy (Zod-only, multi-library support, or validation-agnostic)
- API design considerations for TanStack ecosystem consistency
- Feature priorities (infinite queries, suspense support, SSR considerations)
- Documentation and migration guide requirements
- Testing and quality standards for official adoption
- Naming conventions (should it be `@tanstack/query-generator` or similar?)

## Technical Implementation Details

The current implementation uses:

- TypeScript conditional types for parameter extraction from path templates
- Template literal types for type-safe path building
- Zod for optional runtime validation and type inference
- TanStack Query's `useQuery` and `useMutation` hooks as primitives
- Hierarchical query keys following TanStack Query v5 standards: `[group, endpoint, params]`

Key technical achievements:

- Full type inference without code generation using TypeScript's type system
- Automatic invalidation logic based on HTTP method semantics
- Zero runtime overhead (just thin wrappers around TanStack Query hooks)
- Deterministic query key generation with sorted parameters for cache consistency
