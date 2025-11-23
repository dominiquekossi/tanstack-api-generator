import { createQueryAPI } from "tanstack-api-generator";
import { z } from "zod";

// Define Zod schemas for type safety
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  username: z.string(),
});

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(1),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  username: z.string().min(1).optional(),
});

const PostSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
  userId: z.number(),
});

const PostFilterSchema = z.object({
  userId: z.number().optional(),
  _limit: z.number().optional(),
});

// Create the API with full type inference
export const api = createQueryAPI(
  {
    users: {
      list: {
        method: "GET",
        path: "/users",
        schema: z.array(UserSchema),
      },
      get: {
        method: "GET",
        path: "/users/:id",
        schema: UserSchema,
      },
      create: {
        method: "POST",
        path: "/users",
        bodySchema: CreateUserSchema, // ✅ NEW: Request body is typed
        schema: UserSchema,
      },
      update: {
        method: "PUT",
        path: "/users/:id",
        bodySchema: UpdateUserSchema, // ✅ NEW: Request body is typed
        schema: UserSchema,
      },
      delete: {
        method: "DELETE",
        path: "/users/:id",
      },
    },
    posts: {
      list: {
        method: "GET",
        path: "/posts",
        querySchema: PostFilterSchema, // ✅ NEW: Query params are typed
        schema: z.array(PostSchema),
      },
      get: {
        method: "GET",
        path: "/posts/:id",
        schema: PostSchema,
      },
      byUser: {
        method: "GET",
        path: "/users/:userId/posts",
        schema: z.array(PostSchema),
      },
    },
  } as const,
  {
    baseURL: "https://jsonplaceholder.typicode.com",
    beforeRequest: async (config) => {
      // Example: Add authentication token
      console.log("Making request:", config);
      return config;
    },
    afterResponse: async (response) => {
      // Example: Log responses
      console.log("Received response:", response.status);
      return response;
    },
  }
);

// Export types inferred from schemas
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type Post = z.infer<typeof PostSchema>;
export type PostFilter = z.infer<typeof PostFilterSchema>;
