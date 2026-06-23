import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import path from 'path';

// @ts-expect-error process is a nodejs global
const host: string | undefined = process.env.TAURI_DEV_HOST;

// @ts-expect-error process is a nodejs global
const isDebug = process.env.TAURI_ENV_DEBUG === 'true';
// @ts-expect-error process is a nodejs global
const isWindows = process.env.TAURI_ENV_PLATFORM === 'windows';

export default defineConfig({
  plugins: [tanstackRouter(), react()],
  // 1. 防止 Vite 清除 Rust 显示的错误
  clearScreen: false,
  // 2. Tauri 工作于固定端口，如果端口不可用则报错
  server: {
    port: 1420,
    strictPort: true,
    host: (host || false) as string | false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421
        }
      : undefined,
    watch: {
      // 3. 告诉 Vite 忽略监听 `src-tauri` 目录
      ignored: ['**/src-tauri/**']
    }
  },
  // 4. 添加有关当前构建目标的额外前缀，使这些 CLI 设置的 Tauri 环境变量可以在客户端代码中访问
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // 5. Tauri 在 Windows 上使用 Chromium，在 macOS 和 Linux 上使用 WebKit
    target: isWindows ? 'chrome105' : 'safari13',
    // 6. 在 debug 构建中不使用 minify
    minify: isDebug ? false : 'esbuild',
    // 7. 在 debug 构建中生成 sourcemap
    sourcemap: isDebug
  }
});
