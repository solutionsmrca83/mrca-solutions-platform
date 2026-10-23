export function useRouter() {
  return {
    push: (url: string) => {
      if (typeof window !== 'undefined') {
        window.location.href = url;
      }
    },
    replace: (url: string) => {
      if (typeof window !== 'undefined') {
        window.location.replace(url);
      }
    },
    back: () => {
      if (typeof window !== 'undefined') {
        window.history.back();
      }
    },
    forward: () => {
      if (typeof window !== 'undefined') {
        window.history.forward();
      }
    },
    prefetch: () => {},
  };
}

export function usePathname() {
  return typeof window !== 'undefined' ? window.location.pathname : '/';
}

export function useSearchParams() {
  return typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
}

export function redirect(url: string) {
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
}
