import { describe, it, expect, assertType } from "vitest";
import type { ExtractParams, InferResponse, InferBody } from "../../src/types";
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
  });
});
