import { defineConfig } from "vitepress"

const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true"

export default defineConfig({
  title: "opencode-overlay",
  description: "OpenCode plugin for customizing system prompts and tool definitions.",
  base: isGitHubPagesBuild ? "/opencode-overlay/" : "/",
  cleanUrls: true,
  lastUpdated: true,
  appearance: true,
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Quick Start", link: "/quick-start" },
      { text: "API", link: "/api" },
    ],
    sidebar: [
      {
        text: "Getting Started",
        items: [{ text: "Quick Start", link: "/quick-start" }],
      },
      {
        text: "Reference",
        items: [{ text: "API", link: "/api" }],
      },
    ],
    outline: { level: [2, 3], label: "On this page" },
    search: { provider: "local" },
    socialLinks: [{ icon: "github", link: "https://github.com/yookibooki/opencode-overlay" }],
    footer: {
      message: "File-based OpenCode overlays.",
      copyright: "MIT License",
    },
  },
})
