# Requirements Document

## Introduction

This feature enhances the TanStack Auto Query API library to provide fully generic and dynamic typing for request bodies and response data. Users will be able to define TypeScript interfaces or Zod schemas for both request (IRequest) and response (IResponse) types, enabling complete TypeScript autocompletion and type safety without manual type casting.

## Glossary

- **QueryAPI System**: The TanStack Auto Query API library that generates typed React Query hooks
- **Request Body Schema**: A Zod schema or TypeScript type defining the structure of data sent in POST/PUT/PATCH requests
- **Response Schema**: A Zod schema or TypeScript type defining the structure of data received from API endpoints
- **Type Inference**: TypeScript's ability to automatically determine types from schemas
- **Autocompletion**: IDE feature that suggests available properties and methods based on inferred types
- **Endpoint Configuration**: Object defining an API endpoint with method, path, and schemas

## Requirements

### Requirement 1

**User Story:** As a developer, I want to define request body types using Zod schemas or TypeScript interfaces, so that I get full type safety and autocompletion when passing data to mutations

#### Acceptance Criteria

1. WHEN a developer defines an endpoint with method POST, PUT, or PATCH, THE QueryAPI System SHALL accept an optional `bodySchema` property in the endpoint configuration
2. WHEN a `bodySchema` is provided as a Zod schema, THE QueryAPI System SHALL infer the request body type from the Zod schema
3. WHEN a developer uses a mutation hook with a defined `bodySchema`, THE QueryAPI System SHALL enforce that the `body` property in mutation variables matches the inferred type
4. WHEN a developer types code in their IDE with a typed mutation, THE QueryAPI System SHALL enable TypeScript autocompletion for all properties defined in the body schema
5. WHEN a developer attempts to pass a property not defined in the body schema, THE QueryAPI System SHALL produce a TypeScript compilation error

### Requirement 2

**User Story:** As a developer, I want response data to be automatically typed based on my schema definition, so that I can access response properties with full type safety and autocompletion

#### Acceptance Criteria

1. WHEN a developer defines an endpoint with a `schema` property, THE QueryAPI System SHALL infer the response type from the schema
2. WHEN a developer uses `useQuery` or `useMutation` hooks, THE QueryAPI System SHALL type the `data` property with the inferred response type
3. WHEN a developer accesses properties on the response data in their IDE, THE QueryAPI System SHALL provide autocompletion for all properties defined in the response schema
4. WHEN a developer attempts to access a property not defined in the response schema, THE QueryAPI System SHALL produce a TypeScript compilation error
5. WHEN no schema is provided, THE QueryAPI System SHALL type the response as `unknown` requiring explicit type assertion

### Requirement 3

**User Story:** As a developer, I want to use both Zod schemas and plain TypeScript interfaces for typing, so that I have flexibility in how I define my types

#### Acceptance Criteria

1. WHEN a developer provides a Zod schema for `bodySchema` or `schema`, THE QueryAPI System SHALL infer types using Zod's type inference
2. WHEN a developer wants to use plain TypeScript interfaces, THE QueryAPI System SHALL accept generic type parameters for request and response types
3. WHEN using generic type parameters, THE QueryAPI System SHALL apply those types to the generated hooks without requiring Zod schemas
4. WHEN both Zod schema and generic type parameters are provided, THE QueryAPI System SHALL prioritize the Zod schema for type inference
5. THE QueryAPI System SHALL maintain backward compatibility with existing configurations that only use response schemas

### Requirement 4

**User Story:** As a developer, I want mutations with path parameters and request bodies to be fully typed, so that I can pass both params and body with complete type safety

#### Acceptance Criteria

1. WHEN an endpoint has both path parameters and a request body, THE QueryAPI System SHALL require both `params` and `body` properties in mutation variables
2. WHEN a developer uses a mutation with path parameters, THE QueryAPI System SHALL infer parameter types from the path template
3. WHEN a developer provides mutation variables, THE QueryAPI System SHALL enforce that `params` matches the extracted path parameter types
4. WHEN a developer provides mutation variables, THE QueryAPI System SHALL enforce that `body` matches the body schema type
5. WHEN a developer omits required `params` or `body` properties, THE QueryAPI System SHALL produce a TypeScript compilation error

### Requirement 5

**User Story:** As a developer, I want query parameters to be typed for GET requests, so that I can pass filters and search parameters with type safety

#### Acceptance Criteria

1. WHEN a developer defines a GET endpoint with a `querySchema`, THE QueryAPI System SHALL accept query parameters in the hook call
2. WHEN query parameters are provided, THE QueryAPI System SHALL infer their types from the `querySchema`
3. WHEN a developer passes query parameters to a `useQuery` hook, THE QueryAPI System SHALL enforce type matching with the schema
4. WHEN query parameters are used, THE QueryAPI System SHALL include them in the generated query key for proper caching
5. WHEN a developer attempts to pass invalid query parameters, THE QueryAPI System SHALL produce a TypeScript compilation error

### Requirement 6

**User Story:** As a developer, I want clear TypeScript error messages when I make typing mistakes, so that I can quickly identify and fix issues

#### Acceptance Criteria

1. WHEN a developer passes incorrectly typed data to a hook, THE QueryAPI System SHALL produce a descriptive TypeScript error message
2. WHEN required properties are missing from request bodies, THE QueryAPI System SHALL indicate which properties are missing in the error message
3. WHEN property types don't match the schema, THE QueryAPI System SHALL indicate the expected type and the provided type in the error message
4. WHEN accessing non-existent properties on response data, THE QueryAPI System SHALL produce an error indicating the property does not exist on the type
5. THE QueryAPI System SHALL provide error messages that reference the original schema definition location when possible

### Requirement 7

**User Story:** As a developer, I want the library to validate my configuration at build time, so that I catch type errors before runtime

#### Acceptance Criteria

1. WHEN a developer provides an invalid endpoint configuration, THE QueryAPI System SHALL produce a TypeScript compilation error
2. WHEN `bodySchema` is provided for a GET or DELETE method, THE QueryAPI System SHALL produce a TypeScript error indicating body schemas are not allowed for those methods
3. WHEN required configuration properties are missing, THE QueryAPI System SHALL produce a TypeScript error listing the missing properties
4. WHEN schema types are incompatible, THE QueryAPI System SHALL produce a TypeScript error explaining the incompatibility
5. THE QueryAPI System SHALL perform all validation at compile time without requiring runtime checks for type correctness
