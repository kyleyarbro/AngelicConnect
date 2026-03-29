import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "login.html"),
        defendant: resolve(__dirname, "defendant.html"),
        admin: resolve(__dirname, "admin.html")
      }
    }
  }
});
