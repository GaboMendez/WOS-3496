import Link from "next/link";
import { SOURCE_URL, type WosguruSnapshot } from "@/lib/wosguru/model";
import { formatUtcDateTime } from "@/lib/state";

export function SourceNote({
  snapshot,
  failed = false,
  link = false,
}: {
  snapshot: WosguruSnapshot;
  failed?: boolean;
  link?: boolean;
}) {
  const stale = Date.now() - Date.parse(snapshot.sourceUpdatedAt) > 7 * 86_400_000;
  return (
    <div className="mt-4 space-y-1 text-xs text-muted-foreground">
      <p>
        Source:{" "}
        <a
          href={SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-steel hover:underline"
        >
          WOS Guru
        </a>{" "}
        · Measurements {formatUtcDateTime(snapshot.sourceUpdatedAt)}.
      </p>
      <p>
        Retrieved {formatUtcDateTime(snapshot.fetchedAt)}.
        {snapshot.leaderboardDateLabel
          ? ` Leaderboard ranks dated ${snapshot.leaderboardDateLabel}.`
          : ""}{" "}
        State and leaderboard display values are rounded; player records use exact power where
        supplied by the source endpoint.
      </p>
      {(stale || failed) && (
        <p className="text-ember">
          {failed
            ? "The latest refresh was unavailable. Showing the last successful data."
            : "These measurements are more than seven days old."}
        </p>
      )}
      {link && (
        <Link href="/intelligence" className="inline-block text-steel hover:underline">
          View state intelligence →
        </Link>
      )}
    </div>
  );
}
