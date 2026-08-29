import { createFileRoute } from "@tanstack/react-router";
import { AuthPanel } from "@/components/site/auth-panel";

const TITLE = "Sign in — Autarch AI";
const DESC = "Sign in to your Autarch AI command center to reach your projects, files and generation history.";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <AuthPanel mode="login" />,
});
