/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type */
// Temporary shims to quiet TypeScript/JSX errors until dependencies are installed.
// These are minimal and intended as a stop-gap. Replace by installing proper @types packages.

declare module "next" {
  export type Metadata = any;
}

declare module "next/link" {
  import * as React from 'react';
  const Link: React.FC<any>;
  export default Link;
}

declare module "next/navigation" {
  export function usePathname(): string;
}

declare module "next-auth/react" {
  import * as React from 'react';
  export function useSession(): { data: any; status?: 'loading' | 'authenticated' | 'unauthenticated' };
  export function signOut(options?: { callbackUrl?: string } | undefined): Promise<void> | void;
  export function signIn(provider?: string, options?: any): Promise<void> | void;
  export const SessionProvider: React.FC<any>;
}

declare module "next-auth" {
  export type Session = any;
  export type NextAuthConfig = any;
  function NextAuth(config: any): any;
  export default NextAuth;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

// Minimal React/JSX ambient types for the workspace analyzer
declare namespace React {
  type ReactNode = any;
  type FC<P = {}> = (props: P & { children?: ReactNode }) => any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Minimal module declarations for React (temporary)
declare module 'react' {
  export function useState<S>(initialState: S | (() => S)): [S, (newState: S | ((prev: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps?: any[]): T;
  export function useCallback<T extends (...args: any[]) => any>(cb: T, deps?: any[]): T;
  export function useRef<T>(initialValue: T | null): { current: T | null };
  export function useContext<T = any>(context: any): T;
  export type ReactNode = any;
  export type FC<P = {}> = (props: P & { children?: ReactNode }) => any;
  const React: any;
  export default React;
}

declare module 'react/jsx-runtime' {
  export function jsx(type: any, props: any): any;
  export function jsxs(type: any, props: any): any;
  export function jsxDEV(type: any, props: any, arg2: any): any;
}

declare module 'react/jsx-dev-runtime' {
  export function jsxDEV(type: any, props: any, arg2: any): any;
}
