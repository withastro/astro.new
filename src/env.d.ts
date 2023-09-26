/* eslint-disable @typescript-eslint/consistent-type-definitions */
/// <reference types="astro/client" />
interface ImportMetaEnv {
    readonly GITHUB_TOKEN: string;
    readonly NIGHTLY_BUILD_HOOK: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}