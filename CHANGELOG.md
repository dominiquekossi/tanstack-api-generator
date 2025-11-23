# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-11-23

### 🚀 Major Release - Request/Response Typing

This major release introduces comprehensive request and response typing capabilities, providing full TypeScript autocompletion for request bodies and query parameters.

### ✨ New Features

#### Request Body Typing

- **`bodySchema` Property** - Type and validate request bodies for POST, PUT, and PATCH requests
- **Full TypeScript Autocompletion** - IDE autocomplete for mutation body properties
- **Compile-Time Type Checking** - Catch type errors before runtime
- **Runtime Validation** - Ensure request data matches schema before sending

```typescript
const api = createQueryAPI({
  users: {
    create: {
      method: "POST",
      path: "/users",
      bodySchema: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
      schema: UserSchema,
    },
  },
} as const);

// Full autocompletion for body!
createUser.mutate({
  body: {
    name: "John", // ✅ Autocompleted
    email: "john@example.com", // ✅ Autocompleted
  },
});
```

#### Query Parameter Typing

- **`querySchema` Property** - Type and validate query parameters for GET requests
- **Full TypeScript Autocompletion** - IDE autocomplete for query parameters
- **Automatic Query Key Generation** - Query params included in cache keys
- **Type-Safe Filtering** - Build type-safe filters and pagination

```typescript
const api = createQueryAPI({
  users: {
    list: {
      method: "GET",
      path: "/users",
      querySchema: z.object({
        page: z.number().optional(),
        search: z.string().optional(),
      }),
      schema: z.array(UserSchema),
    },
  },
} as const);

// Full autocompletion for query params!
const { data } = api.users.list.useQuery({
  page: 1, // ✅ Autocompleted
  search: "john", // ✅ Autocompleted
});
```

### 📚 Documentation Improvements

- **New Section**: Request and Response Typing - Comprehensive guide with examples
- **New Section**: Troubleshooting Type Errors - 8 common errors with solutions
- **Enhanced API Reference** - Detailed documentation for `bodySchema` and `querySchema`
- **Updated Features List** - Highlighting new autocompletion capabilities
- **Best Practices** - 5 best practices for type safety

### 🔧 Technical Improvements

- Enhanced type inference for request bodies
- Enhanced type inference for query parameters
- Improved error messages for type mismatches
- Better TypeScript 5.0+ compatibility

### 📝 Examples

- **New Example**: `examples/typed-api/` - Complete demonstration of typing features
- Type-safe queries with query parameters
- Type-safe mutations with body schemas
- Type error examples and solutions

### 🎯 Breaking Changes

None - This release is fully backward compatible. Existing code without `bodySchema` or `querySchema` will continue to work as before.

### 📦 Migration

No migration needed! The new features are opt-in:

- Add `bodySchema` to mutations for request body typing
- Add `querySchema` to queries for query parameter typing
- Existing endpoints without these schemas continue to work unchanged

## [1.0.0] - 2024-11-20

### 🎉 Initial Release

First stable release of tanstack-api-generator - a zero-boilerplate code generation library for TanStack Query v5+.

### ✨ Features

#### Core Functionality

- **Automatic Hook Generation** - GET requests automatically become `useQuery` hooks, mutations become `useMutation` hooks
- **Type-Safe Path Parameters** - Path parameters are automatically extracted from URL patterns and fully typed
- **Complete CRUD Operations** - Full support for GET, POST, PUT, PATCH, and DELETE methods
- **Smart Query Keys** - Deterministic, hierarchical query keys following TanStack Query v5 standards
- **Automatic Invalidation** - Mutations automatically invalidate related queries based on HTTP method
- **Manual Invalidation Utilities** - Programmatic cache invalidation with `invalidate` helpers

#### Type Safety & Validation

- **Full TypeScript Inference** - Complete type safety from configuration to hooks
- **Zod Schema Validation** - Optional runtime type safety with Zod schemas
- **Response Type Inference** - Automatic type inference from Zod schemas
- **Path Parameter Extraction** - Automatic extraction and typing of URL parameters

#### Advanced Features

- **Request Interceptors** - `beforeRequest` hook for authentication, logging, and custom headers
- **Response Interceptors** - `afterResponse` hook for response transformation and error handling
- **Query Key Generation** - Access generated keys for custom cache operations
- **Nested Endpoint Groups** - Organize endpoints by resource type
- **Custom Headers** - Add default headers to all requests
- **Custom QueryClient** - Use your own QueryClient instance

#### Developer Experience

- **Zero Configuration** - Works out of the box with minimal setup
- **Full TanStack Query API** - All `useQuery` and `useMutation` properties and methods available
- **TypeScript Autocomplete** - Complete IDE support with autocomplete
- **Comprehensive Documentation** - Detailed README with examples and use cases
- **Example Project** - Full working example demonstrating all features

### 📦 Package

- **Tiny Bundle Size** - Minimal runtime overhead beyond TanStack Query
- **Tree-Shakeable** - Only import what you use
- **ESM Support** - Modern ES modules
- **TypeScript Declarations** - Full type definitions included

### 📚 Documentation

- Comprehensive README with quick start guide
- Advanced usage examples
- API reference
- Common use cases
- Full working example project in `examples/basic-usage/`
- Type safety documentation in `examples/basic-usage/FULL_API_ACCESS.md`

### 🔧 Technical Details

- Built with TypeScript 5.3+
- Compatible with React 18+
- Compatible with TanStack Query v5+
- Optional Zod 3+ support
- Zero runtime dependencies (peer dependencies only)

### 📝 Example Usage

```typescript
import { createQueryAPI } from "tanstack-api-generator";

const api = createQueryAPI(
  {
    users: {
      list: { method: "GET", path: "/users" },
      get: { method: "GET", path: "/users/:id" },
      create: { method: "POST", path: "/users" },
    },
  } as const,
  { baseURL: "https://api.example.com" }
);

// Use generated hooks
function UserList() {
  const { data: users } = api.users.list.useQuery();
  return (
    <ul>
      {users?.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}
```

### 🙏 Acknowledgments

Built on top of the excellent [TanStack Query](https://tanstack.com/query) library.

[2.0.0]: https://github.com/kossidom/tanstack-api-generator/releases/tag/v2.0.0
[1.0.0]: https://github.com/kossidom/tanstack-api-generator/releases/tag/v1.0.0
