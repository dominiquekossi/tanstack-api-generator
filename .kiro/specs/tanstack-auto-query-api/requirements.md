# Requirements Document

## Introduction

The @tanstack-auto/query-api package is an automatic code generation library that eliminates manual boilerplate when working with TanStack Query v5+. The system generates fully-typed React Query hooks, query keys, fetchers, and invalidation helpers from a simple typed configuration object, reducing development time and ensuring consistency across API integrations.

## Glossary

- **QueryAPI System**: The complete @tanstack-auto/query-api package that generates TanStack Query hooks and utilities
- **API Configuration**: A typed object defining REST endpoints with methods, paths, and parameters
- **Hook Generator**: The component that creates useQuery and useMutation hooks based on HTTP methods
- **Query Key Factory**: The component that generates deterministic, nested query keys following TanStack Query v5 standards
- **Fetch Wrapper**: The HTTP client layer that handles requests, interceptors, and error handling
- **Invalidation Engine**: The component that automatically invalidates related queries after mutations
- **Type Inference System**: The TypeScript utility types that extract and infer parameter and response types
- **Zod Validator**: Optional runtime schema validation using Zod library
- **Generated API**: The output object containing all auto-generated hooks, keys, and utilities

## Requirements

### Requirement 1: Core API Factory

**User Story:** As a developer, I want to provide a simple configuration object and receive a fully-typed API client, so that I can eliminate all manual hook and fetcher boilerplate.

#### Acceptance Criteria

1. THE QueryAPI System SHALL expose a createQueryAPI function that accepts an API Configuration object
2. WHEN createQueryAPI is invoked with valid configuration, THE QueryAPI System SHALL return a Generated API object with typed methods for all defined endpoints
3. THE QueryAPI System SHALL infer TypeScript types for parameters, request bodies, and responses from the API Configuration
4. THE QueryAPI System SHALL organize generated methods by endpoint groups matching the configuration structure
5. THE QueryAPI System SHALL support nested endpoint groupings with unlimited depth

### Requirement 2: Query Key Generation

**User Story:** As a developer, I want deterministic and structured query keys automatically generated, so that I can reliably cache and invalidate queries without manual key management.

#### Acceptance Criteria

1. THE Query Key Factory SHALL generate query keys following TanStack Query v5 hierarchical standards
2. WHEN a query key is requested for an endpoint, THE Query Key Factory SHALL return an array containing the endpoint path segments and parameters
3. THE Query Key Factory SHALL ensure query keys are deterministic for identical parameter inputs
4. THE Query Key Factory SHALL expose a key() method on each generated query endpoint
5. WHERE parameters are provided, THE Query Key Factory SHALL include parameter values in the generated key array

### Requirement 3: HTTP Fetch Layer

**User Story:** As a developer, I want a flexible fetch wrapper that handles common HTTP concerns, so that I can customize authentication, headers, and error handling without reimplementing fetch logic.

#### Acceptance Criteria

1. THE Fetch Wrapper SHALL support configuration of a base URL for all requests
2. THE Fetch Wrapper SHALL provide beforeRequest and afterResponse interceptor hooks
3. THE Fetch Wrapper SHALL inject custom headers into all requests
4. THE Fetch Wrapper SHALL support authentication token injection via interceptors
5. THE Fetch Wrapper SHALL handle AbortSignal for request cancellation
6. THE Fetch Wrapper SHALL automatically parse JSON responses and request bodies
7. IF a request fails, THEN THE Fetch Wrapper SHALL map HTTP errors to structured error objects

### Requirement 4: Automatic Hook Generation

**User Story:** As a developer, I want React Query hooks automatically generated based on HTTP methods, so that I can use queries and mutations without writing repetitive hook code.

#### Acceptance Criteria

1. WHEN an endpoint uses GET method, THE Hook Generator SHALL create a useQuery hook
2. WHEN an endpoint uses POST, PUT, PATCH, or DELETE methods, THE Hook Generator SHALL create a useMutation hook
3. THE Hook Generator SHALL infer parameter types from path parameters defined in the configuration
4. THE Hook Generator SHALL infer request body types for mutation endpoints
5. THE Hook Generator SHALL match the latest TanStack Query v5 hook signatures and options
6. THE Hook Generator SHALL provide full TypeScript autocomplete for hook parameters and options

### Requirement 5: Automatic Query Invalidation

**User Story:** As a developer, I want mutations to automatically invalidate related queries, so that my UI stays synchronized without manual cache management.

#### Acceptance Criteria

1. WHEN a POST mutation succeeds, THE Invalidation Engine SHALL invalidate all list queries for that endpoint group
2. WHEN a PUT or PATCH mutation succeeds, THE Invalidation Engine SHALL invalidate both list queries and the specific item query
3. WHEN a DELETE mutation succeeds, THE Invalidation Engine SHALL invalidate both list queries and the specific item query
4. THE Invalidation Engine SHALL expose invalidate methods for each endpoint group
5. THE Invalidation Engine SHALL provide an invalidate.all() method to clear all queries in an endpoint group

### Requirement 6: Path Parameter Handling

**User Story:** As a developer, I want path parameters automatically extracted and type-checked, so that I can build dynamic URLs without manual string interpolation.

#### Acceptance Criteria

1. THE QueryAPI System SHALL parse path templates containing colon-prefixed parameters (e.g., "/users/:id")
2. THE Type Inference System SHALL extract parameter names from path templates
3. THE QueryAPI System SHALL require parameter values when invoking hooks for parameterized endpoints
4. THE QueryAPI System SHALL replace path parameters with provided values when constructing request URLs
5. THE Type Inference System SHALL enforce TypeScript errors when required parameters are missing

### Requirement 7: Optional Schema Validation

**User Story:** As a developer, I want to optionally validate API responses against Zod schemas, so that I can ensure runtime type safety for critical endpoints.

#### Acceptance Criteria

1. WHERE a Zod schema is provided in the endpoint configuration, THE Zod Validator SHALL validate response data before returning
2. IF response validation fails, THEN THE Zod Validator SHALL throw a structured validation error
3. THE QueryAPI System SHALL support Zod schemas as optional configuration per endpoint
4. THE Type Inference System SHALL infer response types from Zod schemas when provided
5. WHERE no schema is provided, THE QueryAPI System SHALL skip validation and return raw response data

### Requirement 8: TypeScript Type Safety

**User Story:** As a developer, I want complete TypeScript type inference throughout the generated API, so that I catch errors at compile time and have excellent IDE autocomplete.

#### Acceptance Criteria

1. THE Type Inference System SHALL infer all parameter types from path templates
2. THE Type Inference System SHALL infer request body types from configuration
3. THE Type Inference System SHALL infer response types from Zod schemas or generic type parameters
4. THE QueryAPI System SHALL provide autocomplete for all endpoint names and methods
5. THE Type Inference System SHALL enforce type errors when incorrect parameters or bodies are provided

### Requirement 9: Latest TanStack Query Compatibility

**User Story:** As a developer, I want the package to always use the latest TanStack Query APIs, so that I benefit from the newest features and avoid deprecated patterns.

#### Acceptance Criteria

1. THE QueryAPI System SHALL use TanStack Query v5 or later APIs exclusively
2. THE QueryAPI System SHALL avoid all deprecated TanStack Query APIs
3. THE Hook Generator SHALL generate hooks compatible with the latest stable TanStack Query version
4. THE QueryAPI System SHALL document the minimum required TanStack Query version
5. THE QueryAPI System SHALL adapt to TanStack Query API changes in peer dependency ranges

### Requirement 10: Developer Experience

**User Story:** As a developer, I want zero-config defaults and intuitive APIs, so that I can start using the package immediately without extensive setup.

#### Acceptance Criteria

1. THE QueryAPI System SHALL work with zero configuration beyond the endpoint definitions
2. THE QueryAPI System SHALL provide sensible defaults for all optional configuration
3. THE QueryAPI System SHALL expose a clean, composable public API
4. THE QueryAPI System SHALL generate methods that follow consistent naming conventions
5. THE QueryAPI System SHALL provide comprehensive TypeScript documentation via JSDoc comments
