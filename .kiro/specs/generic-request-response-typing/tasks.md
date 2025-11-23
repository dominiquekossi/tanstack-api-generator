# Implementation Plan

- [x] 1. Extend EndpointConfig type with bodySchema and querySchema

  - Add `bodySchema?: z.ZodSchema` property to EndpointConfig type
  - Add `querySchema?: z.ZodSchema` property to EndpointConfig type
  - Update type documentation with examples
  - _Requirements: 1.1, 3.1_

- [x] 2. Enhance type inference utilities

- [x] 2.1 Update InferBody type to extract types from bodySchema

  - Modify InferBody to check for bodySchema property
  - Use Zod type inference with `infer T` pattern
  - Maintain backward compatibility with unknown fallback
  - Add type-level tests for body inference
  - _Requirements: 1.2, 1.3, 3.1, 3.5_

- [x] 2.2 Create InferQuery type for query parameter inference

  - Implement InferQuery type that extracts types from querySchema
  - Provide flexible fallback for untyped queries
  - Support common query parameter types (string, number, boolean)
  - Add type-level tests for query inference
  - _Requirements: 5.2, 5.3_

- [x] 3. Update FetchOptions and FetcherFunction types

  - Add generic type parameters for TBody and TQuery
  - Add query property to FetchOptions
  - Add bodySchema property to FetchOptions for validation
  - Update FetcherFunction signature to support new types
  - _Requirements: 1.1, 5.1_

- [x] 4. Enhance fetcher implementation

- [x] 4.1 Add query parameter serialization

  - Implement URL query string builder
  - Handle arrays and nested objects in query params
  - Encode special characters properly
  - _Requirements: 5.1, 5.4_

- [x] 4.2 Add request body validation

  - Validate body against bodySchema before sending request
  - Throw descriptive errors for validation failures
  - Skip validation if no bodySchema provided
  - _Requirements: 1.1, 6.1_

- [x] 5. Update hook type signatures

- [x] 5.1 Enhance UseQueryHook type

  - Handle combinations of path params and query params
  - Create conditional types for all parameter scenarios
  - Maintain clean positional parameter API
  - Type response data with InferResponse
  - _Requirements: 2.1, 2.2, 5.2, 5.3_

- [x] 5.2 Enhance MutationVariables type

  - Handle combinations of path params and body
  - Make body required when bodySchema is provided
  - Make body optional when no schema (backward compatible)
  - Support void for mutations with no params or body
  - _Requirements: 1.3, 1.4, 4.1, 4.2, 4.3, 4.4_

- [x] 5.3 Update UseMutationHook type

  - Apply enhanced MutationVariables type
  - Type response data with InferResponse
  - Preserve TanStack Query options
  - _Requirements: 1.3, 2.1, 2.2, 4.4_

- [x] 6. Update hook implementation functions

- [x] 6.1 Update createUseQueryHook function

  - Handle query parameters in hook arguments
  - Pass query params to fetcher
  - Include query params in query key generation
  - Maintain backward compatibility
  - _Requirements: 5.1, 5.4_

- [x] 6.2 Update createUseMutationHook function

  - Extract and validate body from variables
  - Pass bodySchema to fetcher for validation
  - Maintain automatic invalidation behavior
  - _Requirements: 1.1, 1.3, 4.3, 4.4_

- [x] 7. Add configuration validation

- [x] 7.1 Add compile-time validation for bodySchema usage

  - Create type-level check that bodySchema is only used with POST/PUT/PATCH
  - Generate TypeScript error for invalid combinations
  - Add helpful error messages
  - _Requirements: 7.2_

- [x] 7.2 Enhance runtime validation in validateEndpoint

  - Check that bodySchema is only provided for POST/PUT/PATCH methods
  - Validate that schemas are valid Zod schemas
  - Provide descriptive error messages
  - _Requirements: 7.1, 7.3, 7.4_

- [x] 8. Update examples and documentation

- [x] 8.1 Create comprehensive usage example

  - Show endpoint configuration with bodySchema and querySchema
  - Demonstrate typed mutations with autocompletion
  - Demonstrate typed queries with query parameters
  - Show TypeScript error scenarios
  - _Requirements: 1.1, 1.4, 2.3, 5.3_

- [x] 8.2 Update existing examples to use new features

  - Add bodySchema to POST/PUT/PATCH endpoints in basic-usage example
  - Add querySchema to GET endpoints with filters
  - Show before/after comparison
  - _Requirements: 3.5_

- [x] 8.3 Create migration guide

  - Document step-by-step migration process
  - Show backward compatibility examples
  - Provide code snippets for common scenarios
  - _Requirements: 3.5_

- [ ] 9. Add type-level tests

  - Create test file for type inference validation
  - Add tests for InferBody with various configurations
  - Add tests for InferQuery with various configurations
  - Add tests for MutationVariables type combinations
  - Add tests for UseQueryHook type combinations
  - Use @ts-expect-error for negative test cases
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1_

- [ ] 10. Update README and API documentation

  - Add section on request/response typing
  - Document bodySchema and querySchema properties
  - Show TypeScript autocompletion benefits
  - Add troubleshooting section for type errors
  - _Requirements: 1.4, 2.3, 6.1, 6.2, 6.3_
