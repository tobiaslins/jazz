---
"cojson-core-wasm": patch
"jazz-tools": patch
"cojson": patch
---

Add WasmCrypto support for Cloudflare Workers and edge runtimes by importing `jazz-tools/load-edge-wasm`.

- Enable WasmCrypto functionality by initializing the WebAssembly environment with the import: `import "jazz-tools/load-edge-wasm"` in edge runtimes.
- Guarantee compatibility across Cloudflare Workers and other edge runtime environments.
