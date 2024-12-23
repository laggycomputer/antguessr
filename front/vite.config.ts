import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
    server: {
        port: parseInt(process.env.PORT ?? "3939") - 1,
        proxy: {
            "/api": "http://localhost:3939"
        }
    },
    plugins: [react()],
})
