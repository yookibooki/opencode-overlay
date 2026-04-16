import { defineConfig } from "vitepress"

const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true"

export default defineConfig({
  title: "opencode-overlay",
  description: "OpenCode overlay for prompts and tools.",
  base: isGitHubPagesBuild ? "/opencode-overlay/" : "/",
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: "Quick Start", link: "/" },
      { text: "Reference", link: "/reference" },
    ],
    search: { provider: "local" },
  },
})
