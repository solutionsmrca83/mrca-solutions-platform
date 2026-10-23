// Ambient type definitions for Next.js Server & Middleware runtime
// Ensures seamless typechecking across Vite, Next.js, and standalone environments

declare module 'next/server' {
  export interface RequestCookie {
    name: string;
    value: string;
  }

  export interface ResponseCookie extends RequestCookie {
    path?: string;
    domain?: string;
    maxAge?: number;
    expires?: Date | number;
    sameSite?: true | false | 'lax' | 'strict' | 'none';
    secure?: boolean;
    httpOnly?: boolean;
    partitioned?: boolean;
  }

  export interface NextRequestCookies {
    get(name: string): RequestCookie | undefined;
    getAll(): RequestCookie[];
    set(name: string, value: string): this;
    delete(name: string): boolean;
    has(name: string): boolean;
  }

  export interface NextResponseCookies {
    get(name: string): ResponseCookie | undefined;
    getAll(): ResponseCookie[];
    set(name: string, value: string, options?: Partial<ResponseCookie>): this;
    delete(name: string): boolean;
    has(name: string): boolean;
  }

  export class NextURL extends URL {
    clone(): NextURL;
  }

  export class NextRequest extends Request {
    cookies: NextRequestCookies;
    nextUrl: NextURL;
    constructor(input: RequestInfo | URL, init?: RequestInit);
  }

  export class NextResponse extends Response {
    cookies: NextResponseCookies;
    static next(init?: { request?: { headers?: Headers } } | { request?: NextRequest }): NextResponse;
    static redirect(url: string | URL, status?: number): NextResponse;
    static rewrite(destination: string | URL, init?: { request?: { headers?: Headers } }): NextResponse;
    static json(body: any, init?: ResponseInit): NextResponse;
  }
}

declare module 'next/headers' {
  export interface ReadonlyRequestCookies {
    get(name: string): { name: string; value: string } | undefined;
    getAll(): Array<{ name: string; value: string }>;
    has(name: string): boolean;
    set(name: string, value: string, options?: any): void;
    delete(name: string): void;
  }

  export function cookies(): Promise<ReadonlyRequestCookies>;
  export function headers(): Promise<Headers>;
}

declare module 'next/navigation' {
  export function redirect(url: string, type?: 'replace' | 'push'): never;
  export function notFound(): never;
  export function useRouter(): any;
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
}

