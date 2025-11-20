# Implementation Plan

- [x] 1. Set up project structure and core types

  - Create package directory structure with src/, tests/ folders
  - Initialize package.json with dependencies and peer dependencies
  - Configure TypeScript with strict mode and ES2020+ target
  - Define core type definitions in types.ts (APIConfig, EndpointConfig, FetchConfig)
  - _Requirements: 1.1, 1.3, 8.1, 8.2, 8.3, 10.1_

- [x] 2. Implement type inference utilities

  - [x] 2.1 Create ExtractParams type utility for path parameter extraction

    - Implement template literal type to parse :param syntax
    - Handle multiple parameters in paths
    - Handle edge cases (no params, trailing slashes)
    - _Requirements: 6.1, 6.2, 8.1_

  - [x] 2.2 Create InferResponse type utility

    - Implement conditional type for Zod schema inference
    - Handle cases without schema (unknown type)
    - _Requirements: 7.4, 8.3_

  - [x] 2.3 Create InferBody type utility

    - Implement conditional type based on HTTP method
    - Only allow body for POST, PUT, PATCH methods
    - _Requirements: 4.4, 8.2_

- [x] 3. Implement fetch wrapper

  - [x] 3.1 Create createFetcher function

    - Accept FetchConfig with baseURL, headers, interceptors
    - Return typed fetcher function
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 3.2 Implement path parameter replacement

    - Parse path template and replace :param with values
    - Validate all required parameters are provided
    - _Requirements: 6.3, 6.4_

  - [x] 3.3 Implement request/response handling

    - Execute beforeRequest interceptor
    - Make fetch call with AbortSignal support
    - Execute afterResponse interceptor
    - Automatic JSON parsing for requests and responses
    - _Requirements: 3.2, 3.4, 3.5, 3.6_

  - [x] 3.4 Implement error handling and mapping

    - Catch network errors and map to APIError
    - Handle HTTP error status codes (4xx, 5xx)
    - Include response data in error objects
    - _Requirements: 3.7_

- [x] 4. Implement query key factory

  - [x] 4.1 Create createKeyFactory function

    - Parse endpoint configuration to extract metadata
    - Generate key factory object matching config structure
    - _Requirements: 2.1, 2.4_

  - [x] 4.2 Implement key generation logic

    - Create hierarchical keys: [group, endpoint, params]
    - Ensure deterministic ordering of parameter keys
    - Handle endpoints with and without parameters
    - _Requirements: 2.2, 2.3, 2.5_

- [x] 5. Implement hook generator

  - [x] 5.1 Create createHooks function

    - Accept API config and fetcher function
    - Determine hook type based on HTTP method (GET → useQuery, others → useMutation)
    - _Requirements: 4.1, 4.2_

  - [x] 5.2 Implement useQuery hook wrapper

    - Wrap TanStack Query's useQuery
    - Inject fetcher with correct path and method
    - Generate and use query keys automatically
    - Pass through all TanStack Query options
    - _Requirements: 4.3, 4.5, 4.6, 9.1, 9.2, 9.3_

  - [x] 5.3 Implement useMutation hook wrapper

    - Wrap TanStack Query's useMutation
    - Inject fetcher with correct path, method, and body
    - Generate query keys for invalidation
    - Pass through all TanStack Query options
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 9.1, 9.2, 9.3_

- [x] 6. Implement invalidation engine

  - [x] 6.1 Create createInvalidation function

    - Accept QueryClient and key factory
    - Generate invalidation utilities matching config structure
    - _Requirements: 5.4_

  - [x] 6.2 Implement automatic invalidation logic

    - POST mutations invalidate list queries
    - PUT/PATCH mutations invalidate list and specific item queries
    - DELETE mutations invalidate list and specific item queries
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 6.3 Implement manual invalidation utilities

    - Create invalidate methods for each endpoint

    - Create invalidate.all() for entire groups
    - Use queryClient.invalidateQueries with key prefixes
    - _Requirements: 5.5_

- [x] 7. Implement optional Zod validation

  - [x] 7.1 Add schema validation to fetcher

    - Check if endpoint has schema defined
    - Validate response data against schema
    - Throw ValidationError on failure
    - Skip validation if no schema provided
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 8. Implement main createQueryAPI factory

  - [x] 8.1 Create createQueryAPI function signature

    - Accept API config and fetch config
    - Return typed Generated API object
    - _Requirements: 1.1, 1.2_

  - [x] 8.2 Orchestrate all components

    - Initialize fetcher with config
    - Create query key factory
    - Generate hooks for all endpoints
    - Create invalidation utilities
    - Combine into final API object with nested structure
    - _Requirements: 1.4, 1.5_

  - [x] 8.3 Add configuration validation

    - Validate endpoint definitions
    - Check for required fields (method, path)
    - Provide helpful error messages for invalid config
    - _Requirements: 10.2, 10.3_

- [x] 9. Add TypeScript documentation

  - [x] 9.1 Add JSDoc comments to all public APIs

    - Document createQueryAPI function
    - Document configuration types
    - Document generated API structure
    - Include usage examples in comments
    - _Requirements: 10.5_

-

- [x] 10. Create package exports and build configuration

  - [x] 10.1 Configure package.json exports

    - Set up main entry point
    - Configure type definitions export
    - Set up peer dependencies correctly
    - _Requirements: 9.4_

  - [x] 10.2 Configure build tooling

    - Set up TypeScript compilation
    - Generate declaration files
    - Configure source maps
    - _Requirements: 9.4_

- [x] 11. Write comprehensive tests

- [ ] 11. Write comprehensive tests

  - [x]\* 11.1 Write unit tests for type inference utilities

    - Test ExtractParams with various path patterns
    - Test InferResponse with and without schemas
    - Test InferBody for different HTTP methods
    - _Requirements: 8.1, 8.2, 8.3_

  - [x]\* 11.2 Write unit tests for fetch wrapper

    - Test path parameter replacement
    - Test interceptor execution
    - Test error mapping
    - Test JSON serialization
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x]\* 11.3 Write unit tests for query key factory

    - Test deterministic key generation
    - Test parameter inclusion
    - Test hierarchical structure
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x]\* 11.4 Write unit tests for hook generator

    - Test correct hook type selection
    - Test parameter passing
    - Test query key usage
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x]\* 11.5 Write unit tests for invalidation engine

    - Test automatic invalidation rules
    - Test manual invalidation utilities
    - Test group-level invalidation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x]\* 11.6 Write integration tests

    - Test end-to-end API generation
    - Test with mock server (MSW)
    - Test TanStack Query integration
    - Test type safety at compile time
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 12. Create documentation and examples

  - [x] 12.1 Write README with usage examples

    - Basic setup and configuration
    - Common use cases
    - Advanced features (interceptors, validation)
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 12.2 Create example project

    - Set up example React app
    - Demonstrate all major features
    - Include TypeScript examples
    - _Requirements: 10.4_
