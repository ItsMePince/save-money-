import { defineConfig } from "cypress";

const isCI = process.env.CI === "true";

export default defineConfig({
    e2e: {
        baseUrl: isCI ? "http://localhost:3000" : "https://my-app.local",
        video: true,
        screenshotOnRunFailure: true,
        setupNodeEvents(on, config) {},
    },
});
