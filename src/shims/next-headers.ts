export function cookies() {
  return {
    get: (name: string) => {
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (match) return { name, value: match[2] };
      }
      return undefined;
    },
    getAll: () => {
      if (typeof document !== 'undefined') {
        return document.cookie.split(';').map((c) => {
          const [name, value] = c.trim().split('=');
          return { name, value };
        });
      }
      return [];
    },
    set: (name: string, value: string) => {
      if (typeof document !== 'undefined') {
        document.cookie = `${name}=${value}; path=/`;
      }
    },
    delete: (name: string) => {
      if (typeof document !== 'undefined') {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    },
    has: (name: string) => {
      if (typeof document !== 'undefined') {
        return document.cookie.includes(`${name}=`);
      }
      return false;
    },
  };
}

export function headers() {
  return new Headers();
}
