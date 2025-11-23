import { createQueryAPI } from "../../../src/index";
import { z } from "zod";

// ============================================================================
// SCHEMAS - Define your data structures with Zod
// ============================================================================

// User schemas
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0),
  role: z.enum(["admin", "user", "guest"]),
  createdAt: z.string(),
});

const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  age: z
    .number()
    .min(0, "Age must be positive")
    .max(150, "Age must be realistic"),
  role: z.enum(["admin", "user", "guest"]).default("user"),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  age: z.number().min(0).max(150).optional(),
  role: z.enum(["admin", "user", "guest"]).optional(),
});

const UserFilterSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  role: z.enum(["admin", "user", "guest"]).optional(),
  minAge: z.number().optional(),
  maxAge: z.number().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

// Post schemas
const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const CreatePostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  status: z.enum(["draft", "published"]).default("draft"),
  tags: z.array(z.string()).default([]),
});

const UpdatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(10).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  tags: z.array(z.string()).optional(),
});

const PostFilterSchema = z.object({
  authorId: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

// Comment schemas
const CommentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  authorId: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

const CreateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

// ============================================================================
// API CONFIGURATION - Full type safety with bodySchema and querySchema
// ============================================================================

export const api = createQueryAPI(
  {
    users: {
      // GET /users - List users with optional filters
      list: {
        method: "GET",
        path: "/users",
        querySchema: UserFilterSchema, // ✅ Query params are typed
        schema: z.array(UserSchema), // ✅ Response is typed
      },

      // GET /users/:id - Get single user
      get: {
        method: "GET",
        path: "/users/:id",
        schema: UserSchema, // ✅ Response is typed
      },

      // POST /users - Create new user
      create: {
        method: "POST",
        path: "/users",
        bodySchema: CreateUserSchema, // ✅ Request body is typed
        schema: UserSchema, // ✅ Response is typed
      },

      // PUT /users/:id - Update user
      update: {
        method: "PUT",
        path: "/users/:id",
        bodySchema: UpdateUserSchema, // ✅ Request body is typed
        schema: UserSchema, // ✅ Response is typed
      },

      // DELETE /users/:id - Delete user
      delete: {
        method: "DELETE",
        path: "/users/:id",
        // No body or response schema needed
      },
    },

    posts: {
      // GET /posts - List posts with optional filters
      list: {
        method: "GET",
        path: "/posts",
        querySchema: PostFilterSchema, // ✅ Query params are typed
        schema: z.array(PostSchema), // ✅ Response is typed
      },

      // GET /posts/:id - Get single post
      get: {
        method: "GET",
        path: "/posts/:id",
        schema: PostSchema, // ✅ Response is typed
      },

      // GET /users/:userId/posts - Get posts by user with filters
      byUser: {
        method: "GET",
        path: "/users/:userId/posts",
        querySchema: PostFilterSchema, // ✅ Query params are typed
        schema: z.array(PostSchema), // ✅ Response is typed
      },

      // POST /posts - Create new post
      create: {
        method: "POST",
        path: "/posts",
        bodySchema: CreatePostSchema, // ✅ Request body is typed
        schema: PostSchema, // ✅ Response is typed
      },

      // PUT /posts/:id - Update post
      update: {
        method: "PUT",
        path: "/posts/:id",
        bodySchema: UpdatePostSchema, // ✅ Request body is typed
        schema: PostSchema, // ✅ Response is typed
      },

      // DELETE /posts/:id - Delete post
      delete: {
        method: "DELETE",
        path: "/posts/:id",
      },
    },

    comments: {
      // GET /posts/:postId/comments - Get comments for a post
      list: {
        method: "GET",
        path: "/posts/:postId/comments",
        schema: z.array(CommentSchema), // ✅ Response is typed
      },

      // POST /posts/:postId/comments - Create comment
      create: {
        method: "POST",
        path: "/posts/:postId/comments",
        bodySchema: CreateCommentSchema, // ✅ Request body is typed
        schema: CommentSchema, // ✅ Response is typed
      },

      // DELETE /comments/:id - Delete comment
      delete: {
        method: "DELETE",
        path: "/comments/:id",
      },
    },
  } as const,
  {
    baseURL: "https://api.example.com",
    beforeRequest: async (config: any) => {
      // Add authentication token
      console.log("Making request:", config);
      return config;
    },
    afterResponse: async (response: any) => {
      console.log("Received response:", response.status);
      return response;
    },
  }
);

// ============================================================================
// EXPORTED TYPES - Infer TypeScript types from Zod schemas
// ============================================================================

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UserFilter = z.infer<typeof UserFilterSchema>;

export type Post = z.infer<typeof PostSchema>;
export type CreatePost = z.infer<typeof CreatePostSchema>;
export type UpdatePost = z.infer<typeof UpdatePostSchema>;
export type PostFilter = z.infer<typeof PostFilterSchema>;

export type Comment = z.infer<typeof CommentSchema>;
export type CreateComment = z.infer<typeof CreateCommentSchema>;
