import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // 讓 shadcn registry 拉進來的檔案照它自己的慣例 import。
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
