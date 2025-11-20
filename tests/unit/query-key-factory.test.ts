import { describe, it, expect } from "vitest";
import { createKeyFactory } from "../../src/keys/createKeyFactory";

describe("Query Key Factory", () => {
  describe("createKeyFactory", () => {
    it("should create key factory for simple configuration", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
          get: { method: "GET" as const, path: "/users/:id" },
        },
      };

      const keys = createKeyFactory(config);

      expect(keys.users.list.key()).toEqual(["users", "list"]);
    });

    it("should generate keys without parameters", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
        },
      };

      const keys = createKeyFactory(config);
      const key = keys.users.list.key();

      expect(key).toEqual(["users", "list"]);
      expect(key.length).toBe(2);
    });

    it("should generate keys with single parameter", () => {
      const config = {
        users: {
          get: { method: "GET" as const, path: "/users/:id" },
        },
      };

      const keys = createKeyFactory(config);
      const key = keys.users.get.key({ id: "123" });

      expect(key).toEqual(["users", "get", { id: "123" }]);
      expect(key.length).toBe(3);
    });

    it("should generate keys with multiple parameters", () => {
      const config = {
        posts: {
          getComment: {
            method: "GET" as const,
            path: "/posts/:postId/comments/:commentId",
          },
        },
      };

      const keys = createKeyFactory(config);
      const key = keys.posts.getComment.key({ postId: "1", commentId: "2" });

      expect(key).toEqual([
        "posts",
        "getComment",
        { commentId: "2", postId: "1" },
      ]);
    });

    it("should ensure deterministic ordering of parameters", () => {
      const config = {
        items: {
          get: { method: "GET" as const, path: "/items/:id/:category/:type" },
        },
      };

      const keys = createKeyFactory(config);

      // Call with different parameter orders
      const key1 = keys.items.get.key({ id: "1", category: "a", type: "x" });
      const key2 = keys.items.get.key({ type: "x", id: "1", category: "a" });
      const key3 = keys.items.get.key({ category: "a", type: "x", id: "1" });

      // All should produce the same key with sorted parameters
      expect(key1).toEqual(key2);
      expect(key2).toEqual(key3);
      expect(key1[2]).toEqual({ category: "a", id: "1", type: "x" });
    });

    it("should handle nested endpoint groups", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
          get: { method: "GET" as const, path: "/users/:id" },
        },
        posts: {
          list: { method: "GET" as const, path: "/posts" },
          get: { method: "GET" as const, path: "/posts/:id" },
        },
      };

      const keys = createKeyFactory(config);

      expect(keys.users.list.key()).toEqual(["users", "list"]);
      expect(keys.users.get.key({ id: "1" })).toEqual([
        "users",
        "get",
        { id: "1" },
      ]);
      expect(keys.posts.list.key()).toEqual(["posts", "list"]);
      expect(keys.posts.get.key({ id: "2" })).toEqual([
        "posts",
        "get",
        { id: "2" },
      ]);
    });

    it("should handle direct endpoint at group level", () => {
      const config = {
        health: { method: "GET" as const, path: "/health" },
      };

      const keys = createKeyFactory(config);
      const key = keys.health.key();

      expect(key).toEqual(["health", "health"]);
    });

    it("should handle optional parameters correctly", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
        },
      };

      const keys = createKeyFactory(config);

      // Call without parameters
      const key1 = keys.users.list.key();
      expect(key1).toEqual(["users", "list"]);

      // Call with undefined
      const key2 = keys.users.list.key(undefined);
      expect(key2).toEqual(["users", "list"]);

      // Call with empty object
      const key3 = keys.users.list.key({});
      expect(key3).toEqual(["users", "list"]);
    });

    it("should support numeric parameter values", () => {
      const config = {
        users: {
          get: { method: "GET" as const, path: "/users/:id" },
        },
      };

      const keys = createKeyFactory(config);
      const key = keys.users.get.key({ id: 123 });

      expect(key).toEqual(["users", "get", { id: 123 }]);
    });
  });
});
