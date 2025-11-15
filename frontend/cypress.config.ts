import { defineConfig } from "cypress";

export default defineConfig({
    e2e: {
        baseUrl: "https://my-app.local", // เปลี่ยนตาม dev server ของคุณ
        video: true,
        screenshotOnRunFailure: true,
        setupNodeEvents(on, config) {
        },
    },
});