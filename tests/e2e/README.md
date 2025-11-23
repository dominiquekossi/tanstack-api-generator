# End-to-End Tests

This directory contains comprehensive end-to-end tests that validate the complete workflow of the tanstack-api-generator package.

## Test Coverage

The `complete-workflow.test.ts` file includes **13 passing tests** that cover:

### Basic API Configuration and Hook Generation (2 tests)

- Creating API with GET endpoints and generating useQuery hooks
- Creating API with POST endpoints and generating useMutation hooks

### Type Safety with bodySchema and querySchema (2 tests)

- Validating request bodies with bodySchema
- Validating query parameters with querySchema

### Path Parameters (1 test)

- Handling path parameters correctly in both queries and mutations

### Interceptors (2 tests)

- Executing beforeRequest interceptor
- Executing afterResponse interceptor

### Query Keys (2 tests)

- Generating correct query keys
- Including query params in query keys

### Cache Invalidation (1 test)

- Invalidating related queries after mutation

### Error Handling (2 tests)

- Handling HTTP errors correctly
- Handling network errors correctly

### Complex Scenarios (1 test)

- Complete CRUD workflow (Create, Read, Update, Delete)

## Running the Tests

```bash
# Run all e2e tests
npm test -- tests/e2e

# Run with verbose output
npm test -- tests/e2e/complete-workflow.test.ts --reporter=verbose

# Run in watch mode
npm test -- tests/e2e --watch
```

## Test Environment

- **Test Framework**: Vitest
- **DOM Environment**: happy-dom
- **React Testing**: @testing-library/react
- **Mocking**: Vitest's built-in mocking

## Key Features Tested

1. **Full Type Safety**: All request and response types are validated
2. **Runtime Validation**: Zod schemas validate data at runtime
3. **Automatic Hook Generation**: useQuery and useMutation hooks are generated automatically
4. **Query Key Management**: Query keys are generated and managed automatically
5. **Cache Invalidation**: Mutations automatically invalidate related queries
6. **Interceptors**: beforeRequest and afterResponse interceptors work correctly
7. **Error Handling**: HTTP and network errors are handled properly
8. **Path Parameters**: Dynamic path parameters are replaced correctly
9. **Query Parameters**: Query strings are built and typed correctly
10. **CRUD Operations**: Complete Create, Read, Update, Delete workflows

## Test Structure

Each test follows this pattern:

1. **Setup**: Create API configuration with schemas
2. **Mock**: Set up fetch mocks with expected responses
3. **Execute**: Render hooks and trigger queries/mutations
4. **Assert**: Verify results, data, and behavior

## Notes

- Tests use mocked fetch responses to avoid real network calls
- QueryClient is reset between tests to ensure isolation
- All tests validate both functionality and type safety
- Tests cover both success and error scenarios
