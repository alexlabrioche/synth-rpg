import { useCallback, useState } from "react";

export function useLocalStorage<TValue>(
  key: string,
  initialValue: TValue
): [TValue, (value: TValue | ((prev: TValue) => TValue)) => void] {
  const readValue = useCallback((): TValue => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item) as TValue;
      }
    } catch {
      // ignore
    }
    return initialValue;
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<TValue>(readValue);

  const setValue = useCallback(
    (value: TValue | ((prev: TValue) => TValue)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(nextValue));
          }
        } catch {
          // ignore
        }
        return nextValue;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
