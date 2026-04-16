import { defineConfig } from "vitepress"

const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true"

export default defineConfig({
  title: "opencode-overlay",
  description: "OpenCode overlay for prompts and tools.",
  base: isGitHubPagesBuild ? "/opencode-overlay/" : "/",
  cleanUrls: true,
  lastUpdated: true,
  appearance: true,
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Quick Start", link: "/quick-start" },
      { text: "Reference", link: "/reference" },
    ],
    sidebar: [
      {
        text: "Getting Started",
        items: [{ text: "Quick Start", link: "/quick-start" }],
      },
      {
        text: "Reference",
        items: [{ text: "Reference", link: "/reference" }],
      },
    ],
    outline: { level: [2, 3], label: "On this page" },
    search: { provider: "local" },
    socialLinks: [{ icon: "github", link: "https://github.com/yookibooki/opencode-overlay" }],
    footer: {
      message: "OpenCode overlay.",
      copyright: "MIT License",
    },
  },
})
