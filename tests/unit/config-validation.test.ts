import { describe, it, expect } from "vitest";
import { createQueryAPI } from "../../src/createQueryAPI";
import { z } from "zod";

describe("Configuration Validation", () => {
  describe("bodySchema validation", () => {
    it("should allow bodySchema for POST method", () => {
      const config = {
        users: {
          create: {
            method: "POST" as const,
            path: "/users",
            bodySchema: z.object({
              name: z.string(),
              email: z.string().email(),
            }),
          },
        },
      };

      expect(() => createQueryAPI(config)).not.toThrow();
    });

    it("should allow bodySchema for PUT method", () => {
      const config = {
        users: {
          update: {
            method: "PUT" as const,
            path: "/users/:id",
            bodySchema: z.object({
              name: z.string(),
            }),
          },
        },
      };

      expect(() => createQueryAPI(config)).not.toThrow();
    });

    it("should allow bodySchema for PATCH method", () => {
      const config = {
        users: {
          patch: {
            method: "PATCH" as const,
            path: "/users/:id",
            bodySchema: z.object({
              name: z.string().optional(),
            }),
          },
        },
      };

      expect(() => createQueryAPI(config)).not.toThrow();
    });

    it("should throw error when bodySchema is used with GET method", () => {
      const config = {
        users: {
          list: {
            method: "GET" as const,
            path: "/users",
            bodySchema: z.object({
              name: z.string(),
            }),
          },
        },
      };

      expect(() => createQueryAPI(config)).toThrow(
        /bodySchema.*only allowed for POST, PUT, and PATCH methods/
      );
      expect(() => createQueryAPI(config)).toThrow(/got "GET"/);
    });

    it("should throw error when bodySchema is used with DELETE method", () => {
      const config = {
        users: {
          delete: {
            method: "DELETE" as const,
            path: "/users/:id",
            bodySchema: z.object({
              reason: z.string(),
            }),
          },
        },
      };

      expect(() => createQueryAPI(config)).toThrow(
        /bodySchema.*only allowed for POST, PUT, and PATCH methods/
      );
      expect(() => createQueryAPI(config)).toThrow(/got "DELETE"/);
    });

    it("should provide helpful error message for invalid bodySchema usage", () => {
      const config = {
        users: {
          list: {
            method: "GET" as const,
            path: "/users",
            bodySchema: z.object({}),
          },
        },
      };

      expect(() => createQueryAPI(config)).toThrow(
        /Remove the "bodySchema" property or change the method/
      );
    });
  });

  describe("schema validation", () => {
    it("should validate that schema is a Zod schema object", () => {
      const config = {
        users: {
          list: {
            method: "GET" as const,
            path: "/users",
            schema: { invalid: "not a zod schema" } as any,
          },
        },
      };

      expect(() => createQueryAPI(config)).toThrow(
        /schema.*must be a Zod schema object/
      );
    });

    it("should validate that bodySchema is a Zod schema object", () => {
      const config = {
        users: {
          create: {
            method: "POST" as const,
            path: "/users",
            bodySchema: { invalid: "not a zod schema" } as any,
          },
        },
      };

      expect(() => createQueryAPI(config)).toThrow(
        /bodySchema.*must be a Zod schema object/
      );
    });

    it("should validate that querySchema is a Zod schema object", () => {
      const config = {
        users: {
          list: {
            method: "GET" as const,
            path: "/users",
            querySchema: { invalid: "not a zod schema" } as any,
          },
        },
      };

      expect(() => createQueryAPI(config)).toThrow(
        /querySchema.*must be a Zod schema object/
      );
    });
  });

  describe("valid configurations", () => {
    it("should accept configuration with all schema types", () => {
      const config = {
        users: {
          list: {
            method: "GET" as const,
            path: "/users",
            querySchema: z.object({
              page: z.number().optional(),
            }),
            schema: z.array(z.object({ id: z.string() })),
          },
          create: {
            method: "POST" as const,
            path: "/users",
            bodySchema: z.object({
              name: z.string(),
            }),
            schema: z.object({ id: z.string() }),
          },
        },
      };

      expect(() => createQueryAPI(config)).not.toThrow();
    });

    it("should accept configuration without any schemas (backward compatibility)", () => {
      const config = {
        users: {
          list: {
            method: "GET" as const,
            path: "/users",
          },
          create: {
            method: "POST" as const,
            path: "/users",
          },
        },
      };

      expect(() => createQueryAPI(config)).not.toThrow();
    });
  });
});
