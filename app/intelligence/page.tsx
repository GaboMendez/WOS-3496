import { redirect } from "next/navigation";

// Preserve existing bookmarks while the source data lives throughout the portal.
export default function IntelligenceRedirect() {
  redirect("/#state-data");
}
