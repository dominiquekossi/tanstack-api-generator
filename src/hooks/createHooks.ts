import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseQueryResult,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/query-core";
import type { z } from "zod";
import type {
  APIConfig,
  EndpointConfig,
  FetcherFunction,
  ExtractParams,
  InferResponse,
  InferBody,
} from "../types";
import type { QueryKeyFactory } from "../keys/createKeyFactory";

/**
 * Generated hooks type that creates useQuery or useMutation based on HTTP method
 */
export type GeneratedHooks<TConfig extends APIConfig> = {
  [Group in keyof TConfig]: TConfig[Group] extends EndpointConfig
    ? TConfig[Group]["method"] extends "GET"
      ? {
          useQuery: UseQueryHook<TConfig[Group]>;
        }
      : {
          useMutation: UseMutationHook<TConfig[Group]>;
        }
    : TConfig[Group] extends Record<string, EndpointConfig>
    ? {
        [Endpoint in keyof TConfig[Group]]: TConfig[Group][Endpoint]["method"] extends "GET"
          ? {
              useQuery: UseQueryHook<TConfig[Group][Endpoint]>;
            }
          : {
              useMutation: UseMutationHook<TConfig[Group][Endpoint]>;
            };
      }
    : never;
};

/**
 * UseQuery hook signature for GET endpoints
 *
 * Handles all combinations of path parameters and query parameters:
 * - No params, no query: (options?) => result
 * - No params, has query: (query, options?) => result
 * - Has params, no query: (params, options?) => result
 * - Has both: (params, query, options?) => result
 */
export type UseQueryHook<TEndpoint extends EndpointConfig> =
  // Check if path has parameters
  ExtractParams<TEndpoint["path"]> extends Record<string, never>
    ? // No path params - check for query params
      TEndpoint extends { querySchema: z.ZodSchema<infer TQuery> }
      ? // No params, has query
        (
          query: TQuery,
          options?: Omit<
            UseQueryOptions<InferResponse<TEndpoint>, Error>,
            "queryKey" | "queryFn"
          >
        ) => UseQueryResult<InferResponse<TEndpoint>, Error>
      : // No params, no query
        (
          options?: Omit<
            UseQueryOptions<InferResponse<TEndpoint>, Error>,
            "queryKey" | "queryFn"
          >
        ) => UseQueryResult<InferResponse<TEndpoint>, Error>
    : // Has path params - check for query params
    TEndpoint extends { querySchema: z.ZodSchema<infer TQuery> }
    ? // Has params, has query
      (
        params: ExtractParams<TEndpoint["path"]>,
        query: TQuery,
        options?: Omit<
          UseQueryOptions<InferResponse<TEndpoint>, Error>,
          "queryKey" | "queryFn"
        >
      ) => UseQueryResult<InferResponse<TEndpoint>, Error>
    : // Has params, no query
      (
        params: ExtractParams<TEndpoint["path"]>,
        options?: Omit<
          UseQueryOptions<InferResponse<TEndpoint>, Error>,
          "queryKey" | "queryFn"
        >
      ) => UseQueryResult<InferResponse<TEndpoint>, Error>;

/**
 * UseMutation hook signature for POST/PUT/PATCH/DELETE endpoints
 *
 * Applies the enhanced MutationVariables type to handle all combinations
 * of path parameters and request body. Response data is typed with InferResponse.
 * Preserves all TanStack Query mutation options.
 *
 * @example
 * ```typescript
 * // Mutation with typed body
 * const { mutate } = api.users.create.useMutation();
 * mutate({ body: { name: 'John', email: 'john@example.com' } });
 *
 * // Mutation with params and typed body
 * const { mutate } = api.users.update.useMutation();
 * mutate({ params: { id: '123' }, body: { name: 'Jane' } });
 * ```
 */
export type UseMutationHook<TEndpoint extends EndpointConfig> = (
  options?: Omit<
    UseMutationOptions<
      InferResponse<TEndpoint>,
      Error,
      MutationVariables<TEndpoint>
    >,
    "mutationFn"
  >
) => UseMutationResult<
  InferResponse<TEndpoint>,
  Error,
  MutationVariables<TEndpoint>
>;

/**
 * Variables passed to mutation functions
 *
 * Handles all combinations of path parameters and request body:
 * - No params, no body: void
 * - No params, untyped body: { body?: unknown }
 * - No params, typed body: { body: T }
 * - Has params, no body: { params: P }
 * - Has params, untyped body: { params: P, body?: unknown }
 * - Has params, typed body: { params: P, body: T }
 */
type MutationVariables<TEndpoint extends EndpointConfig> = ExtractParams<
  TEndpoint["path"]
> extends Record<string, never>
  ? // No path params - check body type
    InferBody<TEndpoint> extends never
    ? void // No params, no body (e.g., POST /logout)
    : TEndpoint extends { bodySchema: z.ZodSchema<infer TBody> }
    ? { body: TBody } // No params, typed body (bodySchema provided)
    : { body?: unknown } // No params, untyped body (backward compatible)
  : // Has path params - check body type
  InferBody<TEndpoint> extends never
  ? { params: ExtractParams<TEndpoint["path"]> } // Has params, no body
  : TEndpoint extends { bodySchema: z.ZodSchema<infer TBody> }
  ? {
      // Has params, typed body (bodySchema provided)
      params: ExtractParams<TEndpoint["path"]>;
      body: TBody;
    }
  : {
      // Has params, untyped body (backward compatible)
      params: ExtractParams<TEndpoint["path"]>;
      body?: unknown;
    };

/**
 * Creates typed React Query hooks for all endpoints in the API configuration
 *
 * Automatically generates useQuery hooks for GET endpoints and useMutation hooks
 * for POST/PUT/PATCH/DELETE endpoints. Hooks are fully typed with parameter and
 * response inference. Mutations automatically invalidate related queries on success.
 *
 * @param config - API configuration defining all endpoints
 * @param fetcher - Configured fetcher function for making HTTP requests
 * @param keyFactory - Query key factory for generating cache keys
 * @param queryClient - TanStack Query client instance for automatic invalidation
 * @returns Generated hooks object matching the config structure
 *
 * @example
 * ```typescript
 * const hooks = createHooks(config, fetcher, keyFactory, queryClient);
 *
 * // Use generated query hook
 * const { data } = hooks.users.list.useQuery();
 *
 * // Use generated mutation hook (automatically invalidates related queries)
 * const { mutate } = hooks.users.create.useMutation();
 * mutate({ body: { name: 'John' } });
 * ```
 */
export function createHooks<TConfig extends APIConfig>(
  config: TConfig,
  fetcher: FetcherFunction,
  keyFactory: QueryKeyFactory<TConfig>,
  queryClient: QueryClient
): GeneratedHooks<TConfig> {
  const hooks: any = {};

  // Iterate through each group in the configuration
  for (const group in config) {
    const groupConfig = config[group];

    // Check if this is a direct endpoint or a nested group
    if (isEndpointConfig(groupConfig)) {
      // Direct endpoint at group level
      const endpoint = groupConfig;
      const keyFn = (keyFactory as any)[group].key;

      if (endpoint.method === "GET") {
        hooks[group] = {
          useQuery: createUseQueryHook(endpoint, fetcher, keyFn),
        };
      } else {
        hooks[group] = {
          useMutation: createUseMutationHook(
            endpoint,
            fetcher,
            queryClient,
            String(group),
            String(group)
          ),
        };
      }
    } else {
      // Nested group with multiple endpoints
      hooks[group] = {};

      for (const endpointName in groupConfig) {
        const endpoint = groupConfig[endpointName] as EndpointConfig;
        const keyFn = (keyFactory as any)[group][endpointName].key;

        if (endpoint.method === "GET") {
          hooks[group][endpointName] = {
            useQuery: createUseQueryHook(endpoint, fetcher, keyFn),
          };
        } else {
          hooks[group][endpointName] = {
            useMutation: createUseMutationHook(
              endpoint,
              fetcher,
              queryClient,
              String(group),
              String(endpointName)
            ),
          };
        }
      }
    }
  }

  return hooks as GeneratedHooks<TConfig>;
}

/**
 * Creates a useQuery hook wrapper for GET endpoints
 */
function createUseQueryHook(
  endpoint: EndpointConfig,
  fetcher: FetcherFunction,
  keyFn: (params?: any, query?: any) => readonly unknown[]
): any {
  return function useQueryHook(arg1?: any, arg2?: any, arg3?: any) {
    // Determine argument positions based on endpoint configuration
    const hasParams = endpoint.path.includes(":");
    const hasQuery = !!endpoint.querySchema;

    let params: any;
    let query: any;
    let options: any;

    if (hasParams && hasQuery) {
      // Has both: (params, query, options?)
      params = arg1;
      query = arg2;
      options = arg3;
    } else if (hasParams) {
      // Has params only: (params, options?)
      params = arg1;
      options = arg2;
    } else if (hasQuery) {
      // Has query only: (query, options?)
      query = arg1;
      options = arg2;
    } else {
      // Has neither: (options?)
      options = arg1;
    }

    // Generate query key including query params for proper caching
    const queryKey = keyFn(params, query);

    // Create query function
    const queryFn = async ({ signal }: { signal?: AbortSignal }) => {
      return fetcher(endpoint.path, {
        method: endpoint.method,
        params,
        query,
        signal,
        schema: endpoint.schema,
      });
    };

    // Call TanStack Query's useQuery with generated key and function
    return useQuery({
      queryKey,
      queryFn,
      ...options,
    });
  };
}

/**
 * Creates a useMutation hook wrapper for POST/PUT/PATCH/DELETE endpoints
 * with automatic query invalidation on success
 */
function createUseMutationHook(
  endpoint: EndpointConfig,
  fetcher: FetcherFunction,
  queryClient: QueryClient,
  group: string,
  _endpointName: string
): any {
  return function useMutationHook(options?: any) {
    // Create mutation function
    const mutationFn = async (variables: any) => {
      // Extract params and body from variables
      const params = variables?.params;
      const body = variables?.body;

      return fetcher(endpoint.path, {
        method: endpoint.method,
        params,
        body,
        schema: endpoint.schema,
        bodySchema: endpoint.bodySchema,
      });
    };

    // Determine automatic invalidation strategy based on HTTP method
    const onSuccess = async (data: any, variables: any, context: any) => {
      // Call user-provided onSuccess first if it exists
      if (options?.onSuccess) {
        await options.onSuccess(data, variables, context);
      }

      // Automatic invalidation based on method
      if (endpoint.method === "POST") {
        // POST mutations invalidate list queries
        await queryClient.invalidateQueries({
          queryKey: [group],
        });
      } else if (endpoint.method === "PUT" || endpoint.method === "PATCH") {
        // PUT/PATCH mutations invalidate list and specific item queries
        await queryClient.invalidateQueries({
          queryKey: [group],
        });
      } else if (endpoint.method === "DELETE") {
        // DELETE mutations invalidate list and specific item queries
        await queryClient.invalidateQueries({
          queryKey: [group],
        });
      }
    };

    // Call TanStack Query's useMutation with generated function and automatic invalidation
    return useMutation({
      mutationFn,
      ...options,
      onSuccess,
    });
  };
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
