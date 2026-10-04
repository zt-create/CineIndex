import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@cinelndex/shared';

/** 成功返回数据，失败返回错误对象。用 ok 字段区分，TS 会自动收窄类型。 */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

interface AsyncActionState {
  loading: boolean;
  error: ApiError | null;
}

/**
 * 把「点击 → 调接口 → 处理错误」这类命令式操作收拢成一个 hook。
 *
 * 组件里只需要：
 *   const { run, loading, error } = useAsyncAction(moviesApi.create);
 *   const result = await run(input);
 *   if (result.ok) navigate(`/movies/${result.data.id}`);
 *
 * 注意：`run` 不会抛错，错误通过返回值与 `error` 状态暴露，
 * 这样调用方不用写 try/catch。
 */
export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
) {
  const [state, setState] = useState<AsyncActionState>({ loading: false, error: null });

  // 组件卸载后不再 setState，避免 React 警告。
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 用 ref 保存最新的 action，这样即使调用方每次都传新函数，run 的引用也是稳定的。
  const actionRef = useRef(action);
  actionRef.current = action;

  const run = useCallback(async (...args: TArgs): Promise<ActionResult<TResult>> => {
    setState({ loading: true, error: null });
    try {
      const data = await actionRef.current(...args);
      if (mountedRef.current) setState({ loading: false, error: null });
      return { ok: true, data };
    } catch (cause) {
      const error =
        cause instanceof ApiError ? cause : new ApiError(0, 'INTERNAL_ERROR', '请求失败');
      if (mountedRef.current) setState({ loading: false, error });
      return { ok: false, error };
    }
  }, []);

  const reset = useCallback(() => setState({ loading: false, error: null }), []);

  return { run, reset, loading: state.loading, error: state.error };
}
