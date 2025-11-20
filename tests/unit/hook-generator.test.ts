import { describe, it, expect, vi } from "vitest";
import { createHooks } from "../../src/hooks/createHooks";
import { createKeyFactory } from "../../src/keys/createKeyFactory";
import type { FetcherFunction } from "../../src/types";

describe("Hook Generator", () => {
  describe("createHooks", () => {
    it("should create hooks object matching config structure", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
          get: { method: "GET" as const, path: "/users/:id" },
          create: { method: "POST" as const, path: "/users" },
        },
      };

      const mockFetcher: FetcherFunction = vi.fn();
      const keyFactory = createKeyFactory(config);
      const hooks = createHooks(config, mockFetcher, keyFactory);

      // Verify structure
      expect(hooks.users).toBeDefined();
      expect(hooks.users.list).toBeDefined();
      expect(hooks.users.get).toBeDefined();
      expect(hooks.users.create).toBeDefined();
    });

    it("should create useQuery hook for GET endpoints", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
        },
      };

      const mockFetcher: FetcherFunction = vi.fn();
      const keyFactory = createKeyFactory(config);
      const hooks = createHooks(config, mockFetcher, keyFactory);

      // Verify useQuery exists
      expect(hooks.users.list.useQuery).toBeDefined();
      expect(typeof hooks.users.list.useQuery).toBe("function");
    });

    it("should create useMutation hook for POST endpoints", () => {
      const config = {
        users: {
          create: { method: "POST" as const, path: "/users" },
        },
      };

      const mockFetcher: FetcherFunction = vi.fn();
      const keyFactory = createKeyFactory(config);
      const hooks = createHooks(config, mockFetcher, keyFactory);

      // Verify useMutation exists
      expect(hooks.users.create.useMutation).toBeDefined();
      expect(typeof hooks.users.create.useMutation).toBe("function");
    });

    it("should create useMutation hook for PUT endpoints", () => {
      const config = {
        users: {
          update: { method: "PUT" as const, path: "/users/:id" },
        },
      };

      const mockFetcher: FetcherFunction = vi.fn();
      const keyFactory = createKeyFactory(config);
      const hooks = createHooks(config, mockFetcher, keyFactory);

      // Verify useMutation exists
      expect(hooks.users.update.useMutation).toBeDefined();
      expect(typeof hooks.users.update.useMutation).toBe("function");
    });

    it("should create useMutation hook for PATCH endpoints", () => {
      const config = {
        users: {
          patch: { method: "PATCH" as const, path: "/users/:id" },
        },
      };

      const mockFetcher: FetcherFunction = vi.fn();
      const keyFactory = createKeyFactory(config);
      const hooks = createHooks(config, mockFetcher, keyFactory);

      // Verify useMutation exists
      expect(hooks.users.patch.useMutation).toBeDefined();
      expect(typeof hooks.users.patch.useMutation).toBe("function");
    });

    it("should create useMutation hook for DELETE endpoints", () => {
      const config = {
        users: {
          delete: { method: "DELETE" as const, path: "/users/:id" },
        },
      };

      const mockFetcher: FetcherFunction = vi.fn();
      const keyFactory = createKeyFactory(config);
      const hooks = createHooks(config, mockFetcher, keyFactory);

      // Verify useMutation exists
      expect(hooks.users.delete.useMutation).toBeDefined();
      expect(typeof hooks.users.delete.useMutation).toBe("function");
    });

    it("should handle multiple endpoint groups", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
        },
        posts: {
          list: { method: "GET" as const, path: "/posts" },
        },
      };

      const mockFetcher: FetcherFunction = vi.fn();
      const keyFactory = createKeyFactory(config);
      const hooks = createHooks(config, mockFetcher, keyFactory);

      // Verify both groups exist
      expect(hooks.users).toBeDefined();
      expect(hooks.posts).toBeDefined();
      expect(hooks.users.list.useQuery).toBeDefined();
      expect(hooks.posts.list.useQuery).toBeDefined();
    });

    it("should handle direct endpoint at group level", () => {
      const config = {
        health: { method: "GET" as const, path: "/health" },
      };

      const mockFetcher: FetcherFunction = vi.fn();
      const keyFactory = createKeyFactory(config);
      const hooks = createHooks(config, mockFetcher, keyFactory);

      // Verify direct endpoint
      expect(hooks.health).toBeDefined();
      expect(hooks.health.useQuery).toBeDefined();
    });

    it("should handle mixed GET and mutation endpoints", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
          get: { method: "GET" as const, path: "/users/:id" },
          create: { method: "POST" as const, path: "/users" },
          update: { method: "PUT" as const, path: "/users/:id" },
          delete: { method: "DELETE" as const, path: "/users/:id" },
        },
      };

      const mockFetcher: FetcherFunction = vi.fn();
      const keyFactory = createKeyFactory(config);
      const hooks = createHooks(config, mockFetcher, keyFactory);

      // Verify GET endpoints have useQuery
      expect(hooks.users.list.useQuery).toBeDefined();
      expect(hooks.users.get.useQuery).toBeDefined();

      // Verify mutation endpoints have useMutation
      expect(hooks.users.create.useMutation).toBeDefined();
      expect(hooks.users.update.useMutation).toBeDefined();
      expect(hooks.users.delete.useMutation).toBeDefined();
    });
  });
});
