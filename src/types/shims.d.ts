// Minimal shims to help the TypeScript analyzer inside the editor when
// node_modules/@types are not visible. These are temporary and safe.

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module 'next' {
  const ns: any;
  export = ns;
}
declare module 'next/link' {
  const comp: any;
  export default comp;
}
declare module 'next/navigation' {
  export function usePathname(): any;
}
declare module 'next-auth/react' {
  export const SessionProvider: any;
  export function useSession(): any;
  export function signIn(...a: any[]): any;
  export function signOut(...a: any[]): any;
}

declare module 'next-auth' {
  const anything: any;
  export = anything;
}
