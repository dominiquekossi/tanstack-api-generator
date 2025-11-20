import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { createQueryAPI } from "../../src/createQueryAPI";
import { z } from "zod";

describe("API Generation Integration", () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("createQueryAPI", () => {
    it("should generate complete API from configuration", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
          get: { method: "GET" as const, path: "/users/:id" },
          create: { method: "POST" as const, path: "/users" },
          update: { method: "PUT" as const, path: "/users/:id" },
          delete: { method: "DELETE" as const, path: "/users/:id" },
        },
      };

      const api = createQueryAPI(config, {
        baseURL: "https://api.example.com",
      });

      // Verify structure
      expect(api.users).toBeDefined();
      expect(api.users.list).toBeDefined();
      expect(api.users.get).toBeDefined();
      expect(api.users.create).toBeDefined();
      expect(api.users.update).toBeDefined();
      expect(api.users.delete).toBeDefined();

      // Verify hooks
      expect(api.users.list.useQuery).toBeDefined();
      expect(api.users.get.useQuery).toBeDefined();
      expect(api.users.create.useMutation).toBeDefined();
      expect(api.users.update.useMutation).toBeDefined();
      expect(api.users.delete.useMutation).toBeDefined();

      // Verify keys
      expect(api.users.list.key).toBeDefined();
      expect(api.users.get.key).toBeDefined();
      expect(api.users.create.key).toBeDefined();

      // Verify invalidation
      expect(api.users.invalidate).toBeDefined();
      expect(api.users.invalidate.all).toBeDefined();
      expect(api.users.invalidate.list).toBeDefined();
    });

    it("should generate API with multiple groups", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
        },
        posts: {
          list: { method: "GET" as const, path: "/posts" },
        },
        comments: {
          list: { method: "GET" as const, path: "/comments" },
        },
      };

      const api = createQueryAPI(config);

      expect(api.users).toBeDefined();
      expect(api.posts).toBeDefined();
      expect(api.comments).toBeDefined();
    });

    it("should handle direct endpoint at group level", () => {
      const config = {
        health: { method: "GET" as const, path: "/health" },
      };

      const api = createQueryAPI(config);

      expect(api.health).toBeDefined();
      expect(api.health.useQuery).toBeDefined();
      expect(api.health.key).toBeDefined();
      expect(api.health.invalidate).toBeDefined();
    });

    it("should generate correct query keys", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
          get: { method: "GET" as const, path: "/users/:id" },
        },
      };

      const api = createQueryAPI(config);

      expect(api.users.list.key()).toEqual(["users", "list"]);
      expect(api.users.get.key({ id: "123" })).toEqual([
        "users",
        "get",
        { id: "123" },
      ]);
    });

    it("should support Zod schema validation", () => {
      const userSchema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
      });

      const config = {
        users: {
          get: {
            method: "GET" as const,
            path: "/users/:id",
            schema: userSchema,
          },
        },
      };

      const api = createQueryAPI(config);

      expect(api.users.get).toBeDefined();
      expect(api.users.get.useQuery).toBeDefined();
    });

    it("should throw error for invalid configuration - empty config", () => {
      expect(() => createQueryAPI({} as any)).toThrow(
        "Invalid API configuration: config must contain at least one endpoint group"
      );
    });

    it("should throw error for invalid configuration - missing method", () => {
      const config = {
        users: {
          list: { path: "/users" } as any,
        },
      };

      expect(() => createQueryAPI(config)).toThrow(
        'Invalid endpoint configuration at "users.list": missing required field "method"'
      );
    });

    it("should throw error for invalid configuration - missing path", () => {
      const config = {
        users: {
          list: { method: "GET" } as any,
        },
      };

      expect(() => createQueryAPI(config)).toThrow(
        'Invalid endpoint configuration at "users.list": missing required field "path"'
      );
    });

    it("should throw error for invalid configuration - invalid method", () => {
      const config = {
        users: {
          list: { method: "INVALID" as any, path: "/users" },
        },
      };

      expect(() => createQueryAPI(config)).toThrow(
        'Invalid endpoint configuration at "users.list": "method" must be one of GET, POST, PUT, PATCH, DELETE'
      );
    });

    it("should throw error for invalid configuration - path not starting with /", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "users" },
        },
      };

      expect(() => createQueryAPI(config)).toThrow(
        'Invalid endpoint configuration at "users.list": "path" must start with "/"'
      );
    });

    it("should accept custom QueryClient", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
        },
      };

      const customQueryClient = new QueryClient();
      const api = createQueryAPI(config, {}, customQueryClient);

      expect(api.users).toBeDefined();
    });

    it("should support nested paths with parameters", () => {
      const config = {
        posts: {
          getComment: {
            method: "GET" as const,
            path: "/posts/:postId/comments/:commentId",
          },
        },
      };

      const api = createQueryAPI(config);

      expect(api.posts.getComment.key({ postId: "1", commentId: "2" })).toEqual(
        ["posts", "getComment", { commentId: "2", postId: "1" }]
      );
    });

    it("should support all HTTP methods", () => {
      const config = {
        resources: {
          get: { method: "GET" as const, path: "/resources/:id" },
          create: { method: "POST" as const, path: "/resources" },
          update: { method: "PUT" as const, path: "/resources/:id" },
          patch: { method: "PATCH" as const, path: "/resources/:id" },
          delete: { method: "DELETE" as const, path: "/resources/:id" },
        },
      };

      const api = createQueryAPI(config);

      expect(api.resources.get.useQuery).toBeDefined();
      expect(api.resources.create.useMutation).toBeDefined();
      expect(api.resources.update.useMutation).toBeDefined();
      expect(api.resources.patch.useMutation).toBeDefined();
      expect(api.resources.delete.useMutation).toBeDefined();
    });

    it("should handle complex nested configuration", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
          get: { method: "GET" as const, path: "/users/:id" },
        },
        posts: {
          list: { method: "GET" as const, path: "/posts" },
          get: { method: "GET" as const, path: "/posts/:id" },
          comments: {
            method: "GET" as const,
            path: "/posts/:postId/comments",
          },
        },
        health: { method: "GET" as const, path: "/health" },
      };

      const api = createQueryAPI(config);

      expect(api.users.list.useQuery).toBeDefined();
      expect(api.posts.comments.useQuery).toBeDefined();
      expect(api.health.useQuery).toBeDefined();
    });

    it("should support baseURL configuration", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
        },
      };

      const api = createQueryAPI(config, {
        baseURL: "https://api.example.com",
      });

      expect(api.users.list).toBeDefined();
    });

    it("should support custom headers configuration", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
        },
      };

      const api = createQueryAPI(config, {
        headers: {
          "X-API-Key": "secret",
          "Content-Type": "application/json",
        },
      });

      expect(api.users.list).toBeDefined();
    });

    it("should support interceptor configuration", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
        },
      };

      const beforeRequest = vi.fn(async (config) => config);
      const afterResponse = vi.fn(async (response) => response);

      const api = createQueryAPI(config, {
        beforeRequest,
        afterResponse,
      });

      expect(api.users.list).toBeDefined();
    });
  });
});
