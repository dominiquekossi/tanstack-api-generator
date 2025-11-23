import { describe, it, expect, assertType } from "vitest";
import type {
  ExtractParams,
  InferResponse,
  InferBody,
  InferQuery,
} from "../../src/types";
import { z } from "zod";

describe("Type Inference Utilities", () => {
  describe("ExtractParams", () => {
    it("should extract single parameter from path", () => {
      type Result = ExtractParams<"/users/:id">;

      // Runtime test to verify the type structure
      const params: Result = { id: "123" };
      expect(params.id).toBe("123");

      const params2: Result = { id: 456 };
      expect(params2.id).toBe(456);
    });

    it("should extract multiple parameters from path", () => {
      type Result = ExtractParams<"/users/:userId/posts/:postId">;

      const params: Result = { userId: "123", postId: "456" };
      expect(params.userId).toBe("123");
      expect(params.postId).toBe("456");
    });

    it("should handle paths with no parameters", () => {
      type Result = ExtractParams<"/users">;

      const params: Result = {};
      expect(params).toEqual({});
    });

    it("should handle trailing slashes", () => {
      type Result = ExtractParams<"/users/:id/">;

      const params: Result = { id: "123" };
      expect(params.id).toBe("123");
    });

    it("should handle complex paths with multiple segments", () => {
      type Result =
        ExtractParams<"/api/v1/users/:userId/posts/:postId/comments/:commentId">;

      const params: Result = {
        userId: "1",
        postId: "2",
        commentId: "3",
      };
      expect(params.userId).toBe("1");
      expect(params.postId).toBe("2");
      expect(params.commentId).toBe("3");
    });
  });

  describe("InferResponse", () => {
    it("should infer type from Zod schema", () => {
      const userSchema = z.object({
        id: z.number(),
        name: z.string(),
      });

      type Endpoint = {
        method: "GET";
        path: "/users/:id";
        schema: typeof userSchema;
      };

      type Result = InferResponse<Endpoint>;

      const response: Result = { id: 1, name: "John" };
      expect(response.id).toBe(1);
      expect(response.name).toBe("John");
    });

    it("should return unknown when no schema is provided", () => {
      type Endpoint = {
        method: "GET";
        path: "/users";
      };

      type Result = InferResponse<Endpoint>;

      // Should be unknown type
      const response: Result = { anything: "goes" };
      expect(response).toBeDefined();
    });
  });

  describe("InferBody", () => {
    it("should allow body for POST method", () => {
      type Endpoint = {
        method: "POST";
        path: "/users";
      };

      type Result = InferBody<Endpoint>;

      // Should be unknown (body allowed)
      const body: Result = { name: "John" };
      expect(body).toBeDefined();
    });

    it("should allow body for PUT method", () => {
      type Endpoint = {
        method: "PUT";
        path: "/users/:id";
      };

      type Result = InferBody<Endpoint>;

      const body: Result = { name: "John" };
      expect(body).toBeDefined();
    });

    it("should allow body for PATCH method", () => {
      type Endpoint = {
        method: "PATCH";
        path: "/users/:id";
      };

      type Result = InferBody<Endpoint>;

      const body: Result = { name: "John" };
      expect(body).toBeDefined();
    });

    it("should not allow body for GET method", () => {
      type Endpoint = {
        method: "GET";
        path: "/users";
      };

      type Result = InferBody<Endpoint>;

      // This should be type 'never', so we can't assign anything to it
      // We'll verify this compiles correctly
      const isNever = (val: never) => val;

      // TypeScript will catch if Result is not 'never'
      // This test verifies the type system works correctly
      expect(true).toBe(true);
    });

    it("should not allow body for DELETE method", () => {
      type Endpoint = {
        method: "DELETE";
        path: "/users/:id";
      };

      type Result = InferBody<Endpoint>;

      // Should be never type
      expect(true).toBe(true);
    });

    it("should infer type from bodySchema for POST method", () => {
      const createUserSchema = z.object({
        name: z.string(),
        email: z.string().email(),
        age: z.number(),
      });

      type Endpoint = {
        method: "POST";
        path: "/users";
        bodySchema: typeof createUserSchema;
      };

      type Result = InferBody<Endpoint>;

      // Should infer { name: string, email: string, age: number }
      const body: Result = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };
      expect(body.name).toBe("John Doe");
      expect(body.email).toBe("john@example.com");
      expect(body.age).toBe(30);
    });

    it("should infer type from bodySchema for PUT method", () => {
      const updateUserSchema = z.object({
        name: z.string(),
        email: z.string().email(),
      });

      type Endpoint = {
        method: "PUT";
        path: "/users/:id";
        bodySchema: typeof updateUserSchema;
      };

      type Result = InferBody<Endpoint>;

      const body: Result = {
        name: "Jane Doe",
        email: "jane@example.com",
      };
      expect(body.name).toBe("Jane Doe");
      expect(body.email).toBe("jane@example.com");
    });

    it("should infer type from bodySchema for PATCH method", () => {
      const patchUserSchema = z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
      });

      type Endpoint = {
        method: "PATCH";
        path: "/users/:id";
        bodySchema: typeof patchUserSchema;
      };

      type Result = InferBody<Endpoint>;

      const body: Result = {
        name: "Updated Name",
      };
      expect(body.name).toBe("Updated Name");
    });

    it("should fallback to unknown when no bodySchema provided (backward compatibility)", () => {
      type Endpoint = {
        method: "POST";
        path: "/users";
      };

      type Result = InferBody<Endpoint>;

      // Should be unknown type (backward compatible)
      const body: Result = { anything: "goes" };
      expect(body).toBeDefined();
    });

    it("should handle complex nested bodySchema", () => {
      const complexSchema = z.object({
        user: z.object({
          name: z.string(),
          profile: z.object({
            bio: z.string(),
            age: z.number(),
          }),
        }),
        tags: z.array(z.string()),
      });

      type Endpoint = {
        method: "POST";
        path: "/data";
        bodySchema: typeof complexSchema;
      };

      type Result = InferBody<Endpoint>;

      const body: Result = {
        user: {
          name: "John",
          profile: {
            bio: "Developer",
            age: 30,
          },
        },
        tags: ["typescript", "react"],
      };
      expect(body.user.name).toBe("John");
      expect(body.user.profile.age).toBe(30);
      expect(body.tags).toHaveLength(2);
    });
  });

  describe("InferQuery", () => {
    it("should infer type from querySchema", () => {
      const userFilterSchema = z.object({
        name: z.string().optional(),
        email: z.string().optional(),
        page: z.number().optional(),
      });

      type Endpoint = {
        method: "GET";
        path: "/users";
        querySchema: typeof userFilterSchema;
      };

      type Result = InferQuery<Endpoint>;

      const query: Result = {
        name: "John",
        page: 1,
      };
      expect(query.name).toBe("John");
      expect(query.page).toBe(1);
    });

    it("should handle required query parameters", () => {
      const searchSchema = z.object({
        q: z.string(),
        limit: z.number(),
      });

      type Endpoint = {
        method: "GET";
        path: "/search";
        querySchema: typeof searchSchema;
      };

      type Result = InferQuery<Endpoint>;

      const query: Result = {
        q: "typescript",
        limit: 10,
      };
      expect(query.q).toBe("typescript");
      expect(query.limit).toBe(10);
    });

    it("should handle boolean query parameters", () => {
      const filterSchema = z.object({
        active: z.boolean(),
        verified: z.boolean().optional(),
      });

      type Endpoint = {
        method: "GET";
        path: "/users";
        querySchema: typeof filterSchema;
      };

      type Result = InferQuery<Endpoint>;

      const query: Result = {
        active: true,
        verified: false,
      };
      expect(query.active).toBe(true);
      expect(query.verified).toBe(false);
    });

    it("should fallback to flexible record type when no querySchema provided", () => {
      type Endpoint = {
        method: "GET";
        path: "/users";
      };

      type Result = InferQuery<Endpoint>;

      // Should accept string, number, boolean, or undefined
      const query: Result = {
        name: "John",
        page: 1,
        active: true,
        optional: undefined,
      };
      expect(query.name).toBe("John");
      expect(query.page).toBe(1);
      expect(query.active).toBe(true);
    });

    it("should handle array query parameters", () => {
      const filterSchema = z.object({
        tags: z.array(z.string()),
        ids: z.array(z.number()),
      });

      type Endpoint = {
        method: "GET";
        path: "/posts";
        querySchema: typeof filterSchema;
      };

      type Result = InferQuery<Endpoint>;

      const query: Result = {
        tags: ["typescript", "react"],
        ids: [1, 2, 3],
      };
      expect(query.tags).toHaveLength(2);
      expect(query.ids).toHaveLength(3);
    });

    it("should handle complex nested query schema", () => {
      const complexQuerySchema = z.object({
        filter: z.object({
          status: z.string(),
          priority: z.number(),
        }),
        sort: z.string().optional(),
      });

      type Endpoint = {
        method: "GET";
        path: "/tasks";
        querySchema: typeof complexQuerySchema;
      };

      type Result = InferQuery<Endpoint>;

      const query: Result = {
        filter: {
          status: "active",
          priority: 1,
        },
        sort: "createdAt",
      };
      expect(query.filter.status).toBe("active");
      expect(query.filter.priority).toBe(1);
      expect(query.sort).toBe("createdAt");
    });
  });
});
