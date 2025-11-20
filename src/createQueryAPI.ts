import { QueryClient } from "@tanstack/react-query";
import type { APIConfig, FetchConfig, EndpointConfig } from "./types";
import { createFetcher } from "./fetch/createFetcher";
import { createKeyFactory } from "./keys/createKeyFactory";
import { createHooks } from "./hooks/createHooks";
import { createInvalidation } from "./invalidation/createInvalidation";

/**
 * Generated API object type combining hooks, keys, and invalidation utilities
 */
export type GeneratedAPI<TConfig extends APIConfig> = {
  [Group in keyof TConfig]: TConfig[Group] extends EndpointConfig
    ? // Direct endpoint at group level
      {
        useQuery?: any;
        useMutation?: any;
        key: (params?: any) => readonly unknown[];
        invalidate: (params?: any) => Promise<void>;
      }
    : TConfig[Group] extends Record<string, EndpointConfig>
    ? // Nested group with multiple endpoints
      {
        [Endpoint in keyof TConfig[Group]]: {
          useQuery?: any;
          useMutation?: any;
          key: (params?: any) => readonly unknown[];
        };
      } & {
        invalidate: {
          all: () => Promise<void>;
          [key: string]: (params?: any) => Promise<void>;
        };
      }
    : never;
};

/**
 * Creates a fully-typed API client with auto-generated TanStack Query hooks
 *
 * @param config - API configuration defining all endpoints
 * @param fetchConfig - Optional fetch wrapper configuration
 * @param queryClient - Optional QueryClient instance (creates new one if not provided)
 * @returns Generated API object with typed hooks, keys, and utilities
 *
 * @example
 * ```typescript
 * const api = createQueryAPI({
 *   users: {
 *     list: { method: 'GET', path: '/users' },
 *     get: { method: 'GET', path: '/users/:id' },
 *   }
 * }, {
 *   baseURL: 'https://api.example.com'
 * });
 *
 * // Use generated hooks
 * const { data } = api.users.list.useQuery();
 * const { data: user } = api.users.get.useQuery({ id: '123' });
 * ```
 */
export function createQueryAPI<TConfig extends APIConfig>(
  config: TConfig,
  fetchConfig?: FetchConfig,
  queryClient?: QueryClient
): GeneratedAPI<TConfig> {
  // Validate configuration
  validateConfig(config);

  // Create or use provided QueryClient
  const client = queryClient || new QueryClient();

  // Initialize fetcher with config
  const fetcher = createFetcher(fetchConfig);

  // Create query key factory
  const keyFactory = createKeyFactory(config);

  // Generate hooks for all endpoints
  const hooks = createHooks(config, fetcher, keyFactory, client);

  // Create invalidation utilities
  const invalidation = createInvalidation(config, client, keyFactory);

  // Combine into final API object with nested structure
  const api: any = {};

  for (const group in config) {
    const groupConfig = config[group];

    // Check if this is a direct endpoint or a nested group
    if (isEndpointConfig(groupConfig)) {
      // Direct endpoint at group level
      api[group] = {
        ...(hooks as any)[group],
        key: (keyFactory as any)[group].key,
        invalidate: (invalidation as any)[group].invalidate,
      };
    } else {
      // Nested group with multiple endpoints
      api[group] = {};

      for (const endpoint in groupConfig) {
        api[group][endpoint] = {
          ...(hooks as any)[group][endpoint],
          key: (keyFactory as any)[group][endpoint].key,
        };
      }

      // Add invalidation utilities at group level
      api[group].invalidate = (invalidation as any)[group].invalidate;
    }
  }

  return api as GeneratedAPI<TConfig>;
}

/**
 * Validates the API configuration
 *
 * @param config - API configuration to validate
 * @throws Error if configuration is invalid
 */
function validateConfig(config: APIConfig): void {
  if (!config || typeof config !== "object") {
    throw new Error(
      "Invalid API configuration: config must be a non-null object"
    );
  }

  if (Object.keys(config).length === 0) {
    throw new Error(
      "Invalid API configuration: config must contain at least one endpoint group"
    );
  }

  for (const group in config) {
    const groupConfig = config[group];

    if (!groupConfig || typeof groupConfig !== "object") {
      throw new Error(
        `Invalid API configuration: group "${group}" must be a non-null object`
      );
    }

    // Check if this is a direct endpoint or a nested group
    if (isEndpointConfig(groupConfig)) {
      // Validate direct endpoint
      validateEndpoint(groupConfig, group);
    } else {
      // Validate nested group
      if (Object.keys(groupConfig).length === 0) {
        throw new Error(
          `Invalid API configuration: group "${group}" must contain at least one endpoint`
        );
      }

      for (const endpoint in groupConfig) {
        const endpointConfig = groupConfig[endpoint];

        if (!endpointConfig || typeof endpointConfig !== "object") {
          throw new Error(
            `Invalid API configuration: endpoint "${group}.${endpoint}" must be a non-null object`
          );
        }

        validateEndpoint(endpointConfig, `${group}.${endpoint}`);
      }
    }
  }
}

/**
 * Validates a single endpoint configuration
 *
 * @param endpoint - Endpoint configuration to validate
 * @param path - Path to the endpoint for error messages
 * @throws Error if endpoint is invalid
 */
function validateEndpoint(endpoint: any, path: string): void {
  // Check for required 'method' field
  if (!("method" in endpoint)) {
    throw new Error(
      `Invalid endpoint configuration at "${path}": missing required field "method"`
    );
  }

  if (typeof endpoint.method !== "string") {
    throw new Error(
      `Invalid endpoint configuration at "${path}": "method" must be a string`
    );
  }

  const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  if (!validMethods.includes(endpoint.method)) {
    throw new Error(
      `Invalid endpoint configuration at "${path}": "method" must be one of ${validMethods.join(
        ", "
      )} (got "${endpoint.method}")`
    );
  }

  // Check for required 'path' field
  if (!("path" in endpoint)) {
    throw new Error(
      `Invalid endpoint configuration at "${path}": missing required field "path"`
    );
  }

  if (typeof endpoint.path !== "string") {
    throw new Error(
      `Invalid endpoint configuration at "${path}": "path" must be a string`
    );
  }

  if (endpoint.path.length === 0) {
    throw new Error(
      `Invalid endpoint configuration at "${path}": "path" cannot be empty`
    );
  }

  // Validate path format
  if (!endpoint.path.startsWith("/")) {
    throw new Error(
      `Invalid endpoint configuration at "${path}": "path" must start with "/" (got "${endpoint.path}")`
    );
  }

  // Validate schema if provided
  if ("schema" in endpoint && endpoint.schema !== undefined) {
    if (
      typeof endpoint.schema !== "object" ||
      endpoint.schema === null ||
      typeof endpoint.schema.parse !== "function"
    ) {
      throw new Error(
        `Invalid endpoint configuration at "${path}": "schema" must be a Zod schema object`
      );
    }
  }
}

/**
 * Type guard to check if a value is an EndpointConfig
 */
function isEndpointConfig(value: any): value is EndpointConfig {
  return (
    value &&
    typeof value === "object" &&
    "method" in value &&
    "path" in value &&
    typeof value.method === "string" &&
    typeof value.path === "string"
  );
}
