/**
 * Automatically sets up the Cmd+J listener if 'allowJazzInspector' is present in the URL
 * @returns A cleanup function if the listener was set up, undefined otherwise
 */
export declare function setupInspector(): (() => void) | undefined;
