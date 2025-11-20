# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/kossidom/tanstack-api-generator/releases/tag/v1.0.0
