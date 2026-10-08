import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async loader and tracks loading / success / error state.
 * Pass `enabled: false` to wait until inputs are ready.
 */
export const useAsync = (loader, deps = [], { enabled = true } = {}) => {
  const [state, setState] = useState({ status: enabled ? 'loading' : 'idle', data: null, error: null });
  const latest = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  const reload = useCallback(async () => {
    const call = ++latest.current;
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const data = await run();
      if (call === latest.current) setState({ status: 'success', data, error: null });
      return data;
    } catch (error) {
      if (call === latest.current) setState((s) => ({ ...s, status: 'error', error }));
      return undefined;
    }
  }, [run]);

  useEffect(() => {
    if (enabled) reload();
  }, [enabled, reload]);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { ...state, loading: state.status === 'loading', reload, setData };
};
