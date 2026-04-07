import { useEffect, useState } from 'react';

const QUERY_MOBILE = '(max-width: 767px)';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(QUERY_MOBILE).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(QUERY_MOBILE);
    const onChange = () => setIsMobile(mql.matches);

    onChange();

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }

    (mql as any).addListener?.(onChange);
    return () => (mql as any).removeListener?.(onChange);
  }, []);

  return isMobile;
}
