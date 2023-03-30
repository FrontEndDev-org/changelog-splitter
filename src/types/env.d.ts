declare module 'process' {
  interface ProcessEnv {
    PKG_NAME: string;
    PKG_VERSION: string;
  }
}
