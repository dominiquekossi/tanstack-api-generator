/**
 * This file demonstrates TypeScript errors that are caught at compile time.
 *
 * Uncomment any section to see the TypeScript error in your IDE.
 * These examples show how the type system prevents common mistakes.
 */

import { api } from "../api";

export function TypeErrorExamples() {
  // ============================================================================
  // ERROR EXAMPLE 1: Invalid property in request body
  // ============================================================================

  const example1 = () => {
    const { mutate } = api.users.create.useMutation();

    // ❌ Uncomment to see error:
    // mutate({
    //   body: {
    //     name: "John",
    //     email: "john@example.com",
    //     age: 30,
    //     role: "user",
    //     invalidField: "test",  // ❌ Error: Object literal may only specify known properties
    //   },
    // });
  };

  // ============================================================================
  // ERROR EXAMPLE 2: Wrong type for property
  // ============================================================================

  const example2 = () => {
    const { mutate } = api.users.create.useMutation();

    // ❌ Uncomment to see error:
    // mutate({
    //   body: {
    //     name: "John",
    //     email: "john@example.com",
    //     age: "30",  // ❌ Error: Type 'string' is not assignable to type 'number'
    //     role: "user",
    //   },
    // });
  };

  // ============================================================================
  // ERROR EXAMPLE 3: Missing required property
  // ============================================================================

  const example3 = () => {
    const { mutate } = api.users.create.useMutation();

    // ❌ Uncomment to see error:
    // mutate({
    //   body: {
    //     name: "John",
    //     email: "john@example.com",
    //     // ❌ Error: Property 'age' is missing in type
    //   },
    // });
  };

  // ============================================================================
  // ERROR EXAMPLE 4: Invalid enum value
  // ============================================================================

  const example4 = () => {
    const { mutate } = api.users.create.useMutation();

    // ❌ Uncomment to see error:
    // mutate({
    //   body: {
    //     name: "John",
    //     email: "john@example.com",
    //     age: 30,
    //     role: "superadmin",  // ❌ Error: Type '"superadmin"' is not assignable to type '"admin" | "user" | "guest"'
    //   },
    // });
  };

  // ============================================================================
  // ERROR EXAMPLE 5: Invalid query parameter
  // ============================================================================

  const example5 = () => {
    // ❌ Uncomment to see error:
    // const { data } = api.users.list.useQuery({
    //   name: "John",
    //   invalidParam: "test",  // ❌ Error: Object literal may only specify known properties
    // });
  };

  // ============================================================================
  // ERROR EXAMPLE 6: Wrong type for query parameter
  // ============================================================================

  const example6 = () => {
    // ❌ Uncomment to see error:
    // const { data } = api.users.list.useQuery({
    //   page: "1",  // ❌ Error: Type 'string' is not assignable to type 'number'
    //   limit: 10,
    // });
  };

  // ============================================================================
  // ERROR EXAMPLE 7: Invalid query parameter enum value
  // ============================================================================

  const example7 = () => {
    // ❌ Uncomment to see error:
    // const { data } = api.users.list.useQuery({
    //   role: "superadmin",  // ❌ Error: Type '"superadmin"' is not assignable to type '"admin" | "user" | "guest"'
    // });
  };

  // ============================================================================
  // ERROR EXAMPLE 8: Accessing non-existent property on response
  // ============================================================================

  const example8 = () => {
    const { data: users } = api.users.list.useQuery({});

    // ❌ Uncomment to see error:
    // users?.map((user) => (
    //   <div key={user.id}>
    //     {user.invalidField}  // ❌ Error: Property 'invalidField' does not exist on type 'User'
    //   </div>
    // ));
  };

  // ============================================================================
  // ERROR EXAMPLE 9: Missing path params
  // ============================================================================

  const example9 = () => {
    const { mutate } = api.users.update.useMutation();

    // ❌ Uncomment to see error:
    // mutate({
    //   // ❌ Error: Property 'params' is missing in type
    //   body: {
    //     name: "Updated Name",
    //   },
    // });
  };

  // ============================================================================
  // ERROR EXAMPLE 10: Body on DELETE request
  // ============================================================================

  const example10 = () => {
    const { mutate } = api.users.delete.useMutation();

    // ❌ Uncomment to see error:
    // mutate({
    //   params: { id: "123" },
    //   body: {},  // ❌ Error: 'body' does not exist in type
    // });
  };

  // ============================================================================
  // ERROR EXAMPLE 11: Wrong path param name
  // ============================================================================

  const example11 = () => {
    const { data } = api.users.get.useQuery(
      // ❌ Uncomment to see error:
      // { userId: "123" }  // ❌ Error: Object literal may only specify known properties, 'userId' does not exist (should be 'id')
      { id: "123" } // ✅ Correct
    );
  };

  // ============================================================================
  // ERROR EXAMPLE 12: Invalid array type in body
  // ============================================================================

  const example12 = () => {
    const { mutate } = api.posts.create.useMutation();

    // ❌ Uncomment to see error:
    // mutate({
    //   body: {
    //     title: "My Post",
    //     content: "Content",
    //     status: "draft",
    //     tags: [1, 2, 3],  // ❌ Error: Type 'number' is not assignable to type 'string'
    //   },
    // });
  };

  return (
    <div className="type-error-examples">
      <h2>TypeScript Error Examples</h2>

      <div className="info-box">
        <h3>🛡️ Type Safety in Action</h3>
        <p>
          This file contains commented-out code examples that demonstrate
          TypeScript errors caught at compile time.
        </p>
        <p>
          Open this file in your IDE and uncomment any example to see the
          TypeScript error message.
        </p>
      </div>

      <div className="error-categories">
        <h3>Error Categories Demonstrated:</h3>
        <ul>
          <li>❌ Invalid properties in request bodies</li>
          <li>❌ Wrong types for properties</li>
          <li>❌ Missing required properties</li>
          <li>❌ Invalid enum values</li>
          <li>❌ Invalid query parameters</li>
          <li>❌ Accessing non-existent response properties</li>
          <li>❌ Missing path parameters</li>
          <li>❌ Body on methods that don't support it</li>
          <li>❌ Wrong parameter names</li>
          <li>❌ Invalid array element types</li>
        </ul>
      </div>

      <div className="benefits">
        <h3>✅ Benefits of Compile-Time Type Checking:</h3>
        <ul>
          <li>Catch errors before runtime</li>
          <li>Immediate feedback in IDE</li>
          <li>Refactoring safety</li>
          <li>Self-documenting code</li>
          <li>Reduced debugging time</li>
          <li>Improved code quality</li>
        </ul>
      </div>
    </div>
  );
}
