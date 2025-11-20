import { api } from "../api";

/**
 * This component demonstrates all the properties and methods
 * available from useQuery and useMutation hooks
 */
export function AdvancedQueryFeatures() {
  // useQuery returns ALL TanStack Query properties
  const {
    data,
    error: _error,
    isLoading,
    isFetching,
    isError,
    isSuccess,
    isPending,
    status,
    fetchStatus,
    refetch,
    dataUpdatedAt: _dataUpdatedAt,
    errorUpdatedAt: _errorUpdatedAt,
    failureCount,
    failureReason: _failureReason,
    isLoadingError: _isLoadingError,
    isPaused,
    isPlaceholderData: _isPlaceholderData,
    isRefetchError: _isRefetchError,
    isRefetching,
    isStale,
  } = api.users.list.useQuery();

  // useMutation also returns ALL TanStack Query properties
  const createUser = api.users.create.useMutation();
  const {
    mutate,
    mutateAsync: _mutateAsync,
    data: mutationData,
    error: mutationError,
    isError: isMutationError,
    isIdle,
    isPending: isMutationPending,
    isSuccess: isMutationSuccess,
    reset,
    status: mutationStatus,
    variables,
    failureCount: mutationFailureCount,
    failureReason: _mutationFailureReason,
    submittedAt: _submittedAt,
  } = createUser;

  return (
    <div className="advanced-features">
      <h2>Advanced Query Features</h2>

      <div className="demo-section">
        <h3>useQuery Properties</h3>
        <div className="property-grid">
          <div className="property-item">
            <strong>data:</strong> {data ? `${data.length} users` : "null"}
          </div>
          <div className="property-item">
            <strong>isLoading:</strong> {String(isLoading)}
          </div>
          <div className="property-item">
            <strong>isFetching:</strong> {String(isFetching)}
          </div>
          <div className="property-item">
            <strong>isError:</strong> {String(isError)}
          </div>
          <div className="property-item">
            <strong>isSuccess:</strong> {String(isSuccess)}
          </div>
          <div className="property-item">
            <strong>isPending:</strong> {String(isPending)}
          </div>
          <div className="property-item">
            <strong>status:</strong> {status}
          </div>
          <div className="property-item">
            <strong>fetchStatus:</strong> {fetchStatus}
          </div>
          <div className="property-item">
            <strong>isStale:</strong> {String(isStale)}
          </div>
          <div className="property-item">
            <strong>isRefetching:</strong> {String(isRefetching)}
          </div>
          <div className="property-item">
            <strong>isPaused:</strong> {String(isPaused)}
          </div>
          <div className="property-item">
            <strong>failureCount:</strong> {failureCount}
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={() => refetch()} className="btn-action">
            Refetch Data
          </button>
        </div>
      </div>

      <div className="demo-section">
        <h3>useMutation Properties</h3>
        <div className="property-grid">
          <div className="property-item">
            <strong>isPending:</strong> {String(isMutationPending)}
          </div>
          <div className="property-item">
            <strong>isIdle:</strong> {String(isIdle)}
          </div>
          <div className="property-item">
            <strong>isSuccess:</strong> {String(isMutationSuccess)}
          </div>
          <div className="property-item">
            <strong>isError:</strong> {String(isMutationError)}
          </div>
          <div className="property-item">
            <strong>status:</strong> {mutationStatus}
          </div>
          <div className="property-item">
            <strong>data:</strong> {mutationData ? "Has data" : "null"}
          </div>
          <div className="property-item">
            <strong>error:</strong>{" "}
            {mutationError ? mutationError.message : "null"}
          </div>
          <div className="property-item">
            <strong>variables:</strong> {variables ? "Has variables" : "null"}
          </div>
          <div className="property-item">
            <strong>failureCount:</strong> {mutationFailureCount}
          </div>
        </div>

        <div className="action-buttons">
          <button
            onClick={() =>
              mutate({
                body: {
                  name: "Test User",
                  email: "test@example.com",
                  username: "testuser",
                },
              })
            }
            disabled={isMutationPending}
            className="btn-action"
          >
            Test Mutation
          </button>
          <button onClick={() => reset()} className="btn-action">
            Reset Mutation
          </button>
        </div>
      </div>

      <div className="demo-section info-box">
        <h4>📋 Available Properties & Methods</h4>
        <div className="feature-columns">
          <div>
            <h5>useQuery Returns:</h5>
            <ul>
              <li>data, error, status, fetchStatus</li>
              <li>isLoading, isFetching, isPending</li>
              <li>isError, isSuccess, isStale</li>
              <li>isRefetching, isPaused</li>
              <li>isPlaceholderData</li>
              <li>refetch() - Manual refetch</li>
              <li>dataUpdatedAt, errorUpdatedAt</li>
              <li>failureCount, failureReason</li>
            </ul>
          </div>
          <div>
            <h5>useMutation Returns:</h5>
            <ul>
              <li>mutate(), mutateAsync()</li>
              <li>data, error, status</li>
              <li>isPending, isIdle, isSuccess, isError</li>
              <li>reset() - Reset mutation state</li>
              <li>variables - Last mutation variables</li>
              <li>failureCount, failureReason</li>
              <li>submittedAt - Timestamp</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
