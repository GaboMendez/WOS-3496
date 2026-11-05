import Link from "next/link";
import type { WosguruSnapshot } from "@/lib/wosguru/model";
import { formatUtcDateTime } from "@/lib/state";

export function SourceNote({
  snapshot,
  link = false,
}: {
  snapshot: Pick<WosguruSnapshot, "sourceUpdatedAt" | "leaderboardDateLabel">;
  failed?: boolean;
  link?: boolean;
  collecting?: boolean;
}) {
  return (
    <div className="mt-4 space-y-1 text-xs text-muted-foreground">
      <p>
        Last updated {formatUtcDateTime(snapshot.sourceUpdatedAt)}.
        {snapshot.leaderboardDateLabel
          ? ` Rankings dated ${snapshot.leaderboardDateLabel}.`
          : ""}
      </p>
      {link && (
        <Link href="/#state-data" className="inline-block text-steel hover:underline">
          View state ratings →
        </Link>
      )}
    </div>
  );
}
