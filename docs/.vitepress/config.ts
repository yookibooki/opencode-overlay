import { defineConfig } from "vitepress";

export default defineConfig({
  title: "opencode-overlay",
  description:
    "OpenCode plugin for customizing system prompts and tool definitions.",
  base: "/opencode-overlay/",
  appearance: true,

  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Quick Start", link: "/quick-start" },
      { text: "API", link: "/api" },
    ],

    sidebar: [
      {
        text: "Docs",
        items: [
          { text: "Home", link: "/" },
          { text: "Quick Start", link: "/quick-start" },
          { text: "API", link: "/api" },
        ],
      },
    ],

    search: {
      provider: "local",
    },
  },
});
