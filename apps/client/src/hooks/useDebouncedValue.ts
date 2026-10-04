import { useEffect, useState } from 'react';

/** 防抖：搜索框每敲一个字符都发请求太浪费，通常延迟 300ms 再提交。 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
