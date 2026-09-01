import { useEffect, useState } from 'react';

/**
 * Hook para obtener la fecha/hora actual viva cada 60s sin romper el React Compiler.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
