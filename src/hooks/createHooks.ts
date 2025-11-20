import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseQueryResult,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/query-core";
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
 */
export type UseQueryHook<TEndpoint extends EndpointConfig> = ExtractParams<
  TEndpoint["path"]
> extends Record<string, never>
  ? // No parameters required
    (
      options?: Omit<
        UseQueryOptions<InferResponse<TEndpoint>, Error>,
        "queryKey" | "queryFn"
      >
    ) => UseQueryResult<InferResponse<TEndpoint>, Error>
  : // Parameters required
    (
      params: ExtractParams<TEndpoint["path"]>,
      options?: Omit<
        UseQueryOptions<InferResponse<TEndpoint>, Error>,
        "queryKey" | "queryFn"
      >
    ) => UseQueryResult<InferResponse<TEndpoint>, Error>;

/**
 * UseMutation hook signature for POST/PUT/PATCH/DELETE endpoints
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
 */
type MutationVariables<TEndpoint extends EndpointConfig> = ExtractParams<
  TEndpoint["path"]
> extends Record<string, never>
  ? InferBody<TEndpoint> extends never
    ? void // No params, no body
    : { body: InferBody<TEndpoint> } // No params, has body
  : InferBody<TEndpoint> extends never
  ? { params: ExtractParams<TEndpoint["path"]> } // Has params, no body
  : {
      // Has both params and body
      params: ExtractParams<TEndpoint["path"]>;
      body: InferBody<TEndpoint>;
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
  keyFn: (params?: any) => readonly unknown[]
): any {
  return function useQueryHook(paramsOrOptions?: any, maybeOptions?: any) {
    // Determine if first argument is params or options
    // If endpoint has path parameters, first arg is params
    const hasParams = endpoint.path.includes(":");
    const params = hasParams ? paramsOrOptions : undefined;
    const options = hasParams ? maybeOptions : paramsOrOptions;

    // Generate query key
    const queryKey = keyFn(params);

    // Create query function
    const queryFn = async ({ signal }: { signal?: AbortSignal }) => {
      return fetcher(endpoint.path, {
        method: endpoint.method,
        params,
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
