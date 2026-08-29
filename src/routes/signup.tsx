import { createFileRoute } from "@tanstack/react-router";
import { AuthPanel } from "@/components/site/auth-panel";

const TITLE = "Get started — create your Autarch AI workspace";
const DESC = "Create an Autarch AI workspace and open 23 AI capabilities behind one command composer.";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: () => <AuthPanel mode="signup" />,
});
