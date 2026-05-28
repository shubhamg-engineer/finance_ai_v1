import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/scenarios")({
  beforeLoad: () => {
    throw redirect({ to: "/agents/planning" });
  },
});
