import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  webpack: (config) => {
    config.externals.push({ sharp: 'commonjs sharp', canvas: 'commonjs canvas' });
    return config;
  }
})