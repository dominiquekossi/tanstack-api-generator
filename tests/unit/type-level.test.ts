/**
 * Type-level tests for compile-time type validation
 *
 * These tests verify that TypeScript correctly infers types and produces
 * compilation errors for invalid usage. They use @ts-expect-error to ensure
 * that certain patterns are correctly rejected by the type system.
 */

import { describe, it, expectTypeOf } from "vitest";
import type {
  EndpointConfig,
  InferBody,
  InferQuery,
  InferResponse,
  ExtractParams,
} from "../../src/types";
import type {
  UseQueryHook,
  UseMutationHook,
} from "../../src/hooks/createHooks";
import type { UseMutationResult } from "@tanstack/react-query";
import { z } from "zod";

// ============================================================================
// Test Schemas
// ============================================================================

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  age: z.number(),
});

const CreateUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0),
});

const UpdateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
});

const UserFilterSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

const SearchQuerySchema = z.object({
  q: z.string(),
  limit: z.number(),
});

// ============================================================================
// InferBody Type Tests
// ============================================================================

describe("InferBody Type-Level Tests", () => {
  describe("Positive Cases", () => {
    it("should infer body type from bodySchema for POST", () => {
      type Endpoint = {
        method: "POST";
        path: "/users";
        bodySchema: typeof CreateUserSchema;
      };

      type Body = InferBody<Endpoint>;

      expectTypeOf<Body>().toEqualTypeOf<{
        name: string;
        email: string;
        age: number;
      }>();
    });

    it("should infer body type from bodySchema for PUT", () => {
      type Endpoint = {
        method: "PUT";
        path: "/users/:id";
        bodySchema: typeof UpdateUserSchema;
      };

      type Body = InferBody<Endpoint>;

      expectTypeOf<Body>().toEqualTypeOf<{
        name?: string;
        email?: string;
      }>();
    });

    it("should infer body type from bodySchema for PATCH", () => {
      type Endpoint = {
        method: "PATCH";
        path: "/users/:id";
        bodySchema: typeof UpdateUserSchema;
      };

      type Body = InferBody<Endpoint>;

      expectTypeOf<Body>().toEqualTypeOf<{
        name?: string;
        email?: string;
      }>();
    });

    it("should return unknown for POST without bodySchema (backward compatible)", () => {
      type Endpoint = {
        method: "POST";
        path: "/users";
      };

      type Body = InferBody<Endpoint>;

      expectTypeOf<Body>().toEqualTypeOf<unknown>();
    });
  });

  describe("Negative Cases", () => {
    it("should return never for GET method", () => {
      type Endpoint = {
        method: "GET";
        path: "/users";
      };

      type Body = InferBody<Endpoint>;

      expectTypeOf<Body>().toEqualTypeOf<never>();
    });

    it("should return never for DELETE method", () => {
      type Endpoint = {
        method: "DELETE";
        path: "/users/:id";
      };

      type Body = InferBody<Endpoint>;

      expectTypeOf<Body>().toEqualTypeOf<never>();
    });
  });
});

// ============================================================================
// InferQuery Type Tests
// ============================================================================

describe("InferQuery Type-Level Tests", () => {
  describe("Positive Cases", () => {
    it("should infer query type from querySchema", () => {
      type Endpoint = {
        method: "GET";
        path: "/users";
        querySchema: typeof UserFilterSchema;
      };

      type Query = InferQuery<Endpoint>;

      expectTypeOf<Query>().toEqualTypeOf<{
        name?: string;
        email?: string;
        page?: number;
        limit?: number;
      }>();
    });

    it("should infer required query parameters", () => {
      type Endpoint = {
        method: "GET";
        path: "/search";
        querySchema: typeof SearchQuerySchema;
      };

      type Query = InferQuery<Endpoint>;

      expectTypeOf<Query>().toEqualTypeOf<{
        q: string;
        limit: number;
      }>();
    });

    it("should fallback to flexible record type without querySchema", () => {
      type Endpoint = {
        method: "GET";
        path: "/users";
      };

      type Query = InferQuery<Endpoint>;

      expectTypeOf<Query>().toEqualTypeOf<
        Record<string, string | number | boolean | undefined>
      >();
    });
  });
});

// ============================================================================
// MutationVariables Type Tests
// ============================================================================

describe("MutationVariables Type-Level Tests", () => {
  // Helper type to extract MutationVariables from UseMutationHook
  // This extracts the third generic parameter (variables) from UseMutationResult
  type ExtractMutationVariables<T> = T extends (
    options?: any
  ) => UseMutationResult<any, any, infer V, any>
    ? V
    : never;

  describe("POST Mutations", () => {
    it("should require body with bodySchema, no params", () => {
      type Endpoint = {
        method: "POST";
        path: "/users";
        bodySchema: typeof CreateUserSchema;
        schema: typeof UserSchema;
      };

      type Hook = UseMutationHook<Endpoint>;
      type Variables = ExtractMutationVariables<Hook>;

      expectTypeOf<Variables>().toEqualTypeOf<{
        body: {
          name: string;
          email: string;
          age: number;
        };
      }>();
    });

    it("should make body optional without bodySchema, no params", () => {
      type Endpoint = {
        method: "POST";
        path: "/users";
        schema: typeof UserSchema;
      };

      type Hook = UseMutationHook<Endpoint>;
      type Variables = ExtractMutationVariables<Hook>;

      expectTypeOf<Variables>().toEqualTypeOf<{
        body?: unknown;
      }>();
    });

    it("should require params and body with bodySchema", () => {
      type Endpoint = {
        method: "POST";
        path: "/users/:userId/posts";
        bodySchema: z.ZodObject<{ title: z.ZodString; content: z.ZodString }>;
      };

      type Hook = UseMutationHook<Endpoint>;
      type Variables = ExtractMutationVariables<Hook>;

      expectTypeOf<Variables>().toEqualTypeOf<{
        params: { userId: string | number };
        body: { title: string; content: string };
      }>();
    });

    it("should be void for POST with no params and no body", () => {
      type Endpoint = {
        method: "POST";
        path: "/logout";
      };

      type Hook = UseMutationHook<Endpoint>;
      type Variables = ExtractMutationVariables<Hook>;

      // For POST without bodySchema, it should be { body?: unknown }
      expectTypeOf<Variables>().toEqualTypeOf<{
        body?: unknown;
      }>();
    });
  });

  describe("PUT Mutations", () => {
    it("should require params and body with bodySchema", () => {
      type Endpoint = {
        method: "PUT";
        path: "/users/:id";
        bodySchema: typeof UpdateUserSchema;
        schema: typeof UserSchema;
      };

      type Hook = UseMutationHook<Endpoint>;
      type Variables = ExtractMutationVariables<Hook>;

      expectTypeOf<Variables>().toEqualTypeOf<{
        params: { id: string | number };
        body: {
          name?: string;
          email?: string;
        };
      }>();
    });

    it("should require params and make body optional without bodySchema", () => {
      type Endpoint = {
        method: "PUT";
        path: "/users/:id";
        schema: typeof UserSchema;
      };

      type Hook = UseMutationHook<Endpoint>;
      type Variables = ExtractMutationVariables<Hook>;

      expectTypeOf<Variables>().toEqualTypeOf<{
        params: { id: string | number };
        body?: unknown;
      }>();
    });
  });

  describe("PATCH Mutations", () => {
    it("should require params and body with bodySchema", () => {
      type Endpoint = {
        method: "PATCH";
        path: "/users/:id";
        bodySchema: typeof UpdateUserSchema;
        schema: typeof UserSchema;
      };

      type Hook = UseMutationHook<Endpoint>;
      type Variables = ExtractMutationVariables<Hook>;

      expectTypeOf<Variables>().toEqualTypeOf<{
        params: { id: string | number };
        body: {
          name?: string;
          email?: string;
        };
      }>();
    });
  });

  describe("DELETE Mutations", () => {
    it("should require only params for DELETE with path params", () => {
      type Endpoint = {
        method: "DELETE";
        path: "/users/:id";
      };

      type Hook = UseMutationHook<Endpoint>;
      type Variables = ExtractMutationVariables<Hook>;

      expectTypeOf<Variables>().toEqualTypeOf<{
        params: { id: string | number };
      }>();
    });

    it("should be void for DELETE without params", () => {
      type Endpoint = {
        method: "DELETE";
        path: "/cache";
      };

      type Hook = UseMutationHook<Endpoint>;
      type Variables = ExtractMutationVariables<Hook>;

      expectTypeOf<Variables>().toEqualTypeOf<void>();
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle multiple path parameters with body", () => {
      type Endpoint = {
        method: "PUT";
        path: "/users/:userId/posts/:postId";
        bodySchema: z.ZodObject<{
          title: z.ZodString;
        }>;
      };

      type Hook = UseMutationHook<Endpoint>;
      type Variables = ExtractMutationVariables<Hook>;

      expectTypeOf<Variables>().toMatchTypeOf<{
        params: { userId: string | number; postId: string | number };
        body: { title: string };
      }>();
    });
  });
});

// ============================================================================
// UseQueryHook Type Tests
// ============================================================================

describe("UseQueryHook Type-Level Tests", () => {
  describe("No Params, No Query", () => {
    it("should accept only options parameter", () => {
      type Endpoint = {
        method: "GET";
        path: "/users";
        schema: z.ZodArray<typeof UserSchema>;
      };

      type Hook = UseQueryHook<Endpoint>;

      // Hook should be callable with options
      expectTypeOf<Hook>().toBeCallableWith({});
      expectTypeOf<Hook>().toBeCallableWith({ enabled: true });
    });
  });

  describe("No Params, Has Query", () => {
    it("should accept query and optional options", () => {
      type Endpoint = {
        method: "GET";
        path: "/users";
        querySchema: typeof UserFilterSchema;
        schema: z.ZodArray<typeof UserSchema>;
      };

      type Hook = UseQueryHook<Endpoint>;

      // Hook should be callable with query parameter
      expectTypeOf<Hook>().toBeCallableWith({
        name: "John",
        page: 1,
      });
      expectTypeOf<Hook>().toBeCallableWith(
        { name: "John" },
        { enabled: true }
      );
    });
  });

  describe("Has Params, No Query", () => {
    it("should accept params and optional options", () => {
      type Endpoint = {
        method: "GET";
        path: "/users/:id";
        schema: typeof UserSchema;
      };

      type Hook = UseQueryHook<Endpoint>;

      // Hook should be callable with params
      expectTypeOf<Hook>().toBeCallableWith({ id: "123" });
      expectTypeOf<Hook>().toBeCallableWith({ id: 123 });
      expectTypeOf<Hook>().toBeCallableWith({ id: "123" }, { enabled: true });
    });

    it("should handle multiple path parameters", () => {
      type Endpoint = {
        method: "GET";
        path: "/users/:userId/posts/:postId";
        schema: z.ZodObject<{ id: z.ZodString; title: z.ZodString }>;
      };

      type Hook = UseQueryHook<Endpoint>;

      expectTypeOf<Hook>().toBeCallableWith({
        userId: "1",
        postId: "2",
      });
      expectTypeOf<Hook>().toBeCallableWith(
        { userId: 1, postId: 2 },
        { enabled: true }
      );
    });
  });

  describe("Has Params and Query", () => {
    it("should accept params, query, and optional options", () => {
      type Endpoint = {
        method: "GET";
        path: "/users/:id/posts";
        querySchema: z.ZodObject<{ page: z.ZodNumber; limit: z.ZodNumber }>;
        schema: z.ZodArray<
          z.ZodObject<{ id: z.ZodString; title: z.ZodString }>
        >;
      };

      type Hook = UseQueryHook<Endpoint>;

      expectTypeOf<Hook>().toBeCallableWith(
        { id: "123" },
        { page: 1, limit: 10 }
      );
      expectTypeOf<Hook>().toBeCallableWith(
        { id: 123 },
        { page: 1, limit: 10 },
        { enabled: true }
      );
    });
  });

  describe("Response Type Inference", () => {
    it("should infer response type from schema", () => {
      type Endpoint = {
        method: "GET";
        path: "/users/:id";
        schema: typeof UserSchema;
      };

      type Hook = UseQueryHook<Endpoint>;
      type Response = InferResponse<Endpoint>;

      expectTypeOf<Response>().toEqualTypeOf<{
        id: string;
        name: string;
        email: string;
        age: number;
      }>();
    });

    it("should return unknown when no schema provided", () => {
      type Endpoint = {
        method: "GET";
        path: "/users";
      };

      type Response = InferResponse<Endpoint>;

      expectTypeOf<Response>().toEqualTypeOf<unknown>();
    });
  });
});

// ============================================================================
// Negative Test Cases with @ts-expect-error
// ============================================================================

describe("Type Error Cases", () => {
  describe("Invalid Body Properties", () => {
    it("should reject invalid properties in typed body", () => {
      type Endpoint = {
        method: "POST";
        path: "/users";
        bodySchema: typeof CreateUserSchema;
      };

      type Body = InferBody<Endpoint>;

      // This should produce a type error
      const invalidBody: Body = {
        name: "John",
        email: "john@example.com",
        age: 30,
        // @ts-expect-error - invalidProp does not exist on type
        invalidProp: true,
      };
    });

    it("should reject missing required properties", () => {
      type Endpoint = {
        method: "POST";
        path: "/users";
        bodySchema: typeof CreateUserSchema;
      };

      type Body = InferBody<Endpoint>;

      // @ts-expect-error - email and age are required
      const incompleteBody: Body = {
        name: "John",
      };
    });

    it("should reject wrong property types", () => {
      type Endpoint = {
        method: "POST";
        path: "/users";
        bodySchema: typeof CreateUserSchema;
      };

      type Body = InferBody<Endpoint>;

      const wrongTypeBody: Body = {
        name: "John",
        email: "john@example.com",
        // @ts-expect-error - age should be number, not string
        age: "30",
      };
    });
  });

  describe("Invalid Query Parameters", () => {
    it("should reject invalid query properties", () => {
      type Endpoint = {
        method: "GET";
        path: "/users";
        querySchema: typeof UserFilterSchema;
      };

      type Query = InferQuery<Endpoint>;

      const invalidQuery: Query = {
        name: "John",
        // @ts-expect-error - invalidParam does not exist on type
        invalidParam: true,
      };
    });

    it("should reject wrong query parameter types", () => {
      type Endpoint = {
        method: "GET";
        path: "/search";
        querySchema: typeof SearchQuerySchema;
      };

      type Query = InferQuery<Endpoint>;

      const wrongTypeQuery: Query = {
        q: "typescript",
        // @ts-expect-error - limit should be number, not string
        limit: "10",
      };
    });

    it("should reject missing required query parameters", () => {
      type Endpoint = {
        method: "GET";
        path: "/search";
        querySchema: typeof SearchQuerySchema;
      };

      type Query = InferQuery<Endpoint>;

      // Verify that both q and limit are required
      expectTypeOf<Query>().toHaveProperty("q");
      expectTypeOf<Query>().toHaveProperty("limit");
      expectTypeOf<{}>().not.toMatchTypeOf<Query>();
    });
  });

  describe("Invalid Path Parameters", () => {
    it("should reject missing path parameters", () => {
      type Params = ExtractParams<"/users/:id">;

      // Verify the type requires id
      expectTypeOf<Params>().toHaveProperty("id");
      expectTypeOf<{}>().not.toMatchTypeOf<Params>();
    });

    it("should reject invalid path parameter names", () => {
      type Params = ExtractParams<"/users/:id">;

      // Verify that wrong parameter name is not assignable
      expectTypeOf<{ userId: string }>().not.toMatchTypeOf<Params>();
      expectTypeOf<{ id: string }>().toMatchTypeOf<Params>();
    });
  });

  describe("Invalid Response Access", () => {
    it("should reject accessing non-existent response properties", () => {
      type Endpoint = {
        method: "GET";
        path: "/users/:id";
        schema: typeof UserSchema;
      };

      type Response = InferResponse<Endpoint>;

      const response: Response = {
        id: "1",
        name: "John",
        email: "john@example.com",
        age: 30,
      };

      // @ts-expect-error - invalidProp does not exist on User type
      const invalid = response.invalidProp;
    });
  });

  describe("Body Schema on Invalid Methods", () => {
    it("should not allow body for GET method", () => {
      // This test verifies that InferBody returns never for GET
      type Endpoint = {
        method: "GET";
        path: "/users";
        bodySchema: typeof CreateUserSchema;
      };

      type Body = InferBody<Endpoint>;

      // Body should be never, so we can't assign anything to it
      expectTypeOf<Body>().toEqualTypeOf<never>();
    });

    it("should not allow body for DELETE method", () => {
      type Endpoint = {
        method: "DELETE";
        path: "/users/:id";
        bodySchema: typeof CreateUserSchema;
      };

      type Body = InferBody<Endpoint>;

      expectTypeOf<Body>().toEqualTypeOf<never>();
    });
  });
});
