import { getTableColumns } from "drizzle-orm";
import state from "./state3496.json";
import { AS_OF, seedTables, tableKeys, type SeedData, type SeedTable } from "./tables";

const allianceId = (tag: string) => `3496-alliance-${tag.toLowerCase()}`;
const dayStart = (date: string) => `${date}T00:00:00.000Z`;
const nextDay = (date: string) => new Date(Date.parse(dayStart(date)) + 86_400_000).toISOString();

export function generateSeed(): SeedData {
  const data = Object.fromEntries(tableKeys.map((key) => [key, []])) as unknown as SeedData;
  const add = <K extends SeedTable>(key: K, row: SeedData[K][number]) =>
    (data[key] as SeedData[K][number][]).push(row);

  add("stateSettings", {
    id: "state-3496",
    ...state.settings,
    tagline: "Alliances, state operations and the road ahead.",
    heroImageUrl: "/images/state-hero.jpg",
    launchDate: null,
    recruitingStatus: null,
    transferSpots: null,
    powerCapNote: null,
    currentEvent: null,
    nextEventDate: state.events[0]?.date ?? null,
    discordUrl: null,
    socialLinks: "[]",
    disclaimer: "Unofficial Whiteout Survival community. Not affiliated with Century Games.",
  });
  state.alliances.forEach((tag, index) =>
    add("alliances", {
      id: allianceId(tag),
      name: tag,
      slug: tag.toLowerCase(),
      tag,
      kind: "other",
      power: null,
      openSpots: null,
      recruitingStatus: null,
      published: true,
      sortRank: index + 1,
    }),
  );
  for (const player of state.players)
    add("players", {
      id: `3496-player-${player.rank}`,
      allianceId: allianceId(player.allianceTag),
      name: player.name,
      furnaceLevel: player.furnaceLevel,
      power: player.power,
      chiefId: null,
      rankTitle: null,
      kills: null,
      activityStatus: null,
      accountKind: null,
      farmOfPlayerId: null,
      lastActiveAt: null,
    });

  add("rankingSnapshots", {
    id: "3496-player-power",
    name: "Player power",
    metric: "power",
    subjectKind: "player",
    capturedAt: dayStart(state.settings.statisticsDate),
  });
  for (const player of state.players)
    add("rankingEntries", {
      id: `3496-power-rank-${player.rank}`,
      snapshotId: "3496-player-power",
      playerId: `3496-player-${player.rank}`,
      allianceId: null,
      rank: player.rank,
      value: player.power,
    });

  for (const cycle of state.svsCycles) {
    const cycleId = `3496-svs-${cycle.date}`;
    const title = `State 3496 vs State ${cycle.opponent}`;
    add("svsCycles", {
      id: cycleId,
      slug: `svs-${cycle.date}`,
      opponent: `State #${cycle.opponent}`,
      eventDate: cycle.date,
      battleResult: cycle.battleResult,
      prepScore: null,
      prepResult: null,
      prepResultNote: null,
      battleScore: null,
      opponentBattleScore: null,
      opponentPrepScore: null,
      storyTitle: title,
      storyIntro:
        cycle.battleResult === "win"
          ? "Castle victory for State 3496."
          : "Castle defeat for State 3496.",
      storyBody: null,
      published: true,
    });
    add("timelineEvents", {
      id: `3496-history-svs-${cycle.date}`,
      title,
      category: "svs",
      description: cycle.battleResult === "win" ? "Castle victory." : "Castle defeat.",
      eventDate: cycle.date,
      serverDay: null,
      published: true,
    });
    add("calendarEvents", {
      id: `3496-calendar-svs-${cycle.date}`,
      name: title,
      kind: "svs",
      cycleId,
      startsAt: dayStart(cycle.date),
      endsAt: nextDay(cycle.date),
      allDay: true,
      status: "completed",
      published: true,
    });
  }

  add("facilities", {
    id: "3496-sunfire",
    name: "Sunfire Castle",
    kind: "sunfire",
    level: null,
    coordinates: null,
    territory: null,
  });
  for (let number = 1; number <= 4; number++)
    add("facilities", {
      id: `3496-stronghold-${number}`,
      name: `Stronghold ${number}`,
      kind: "stronghold",
      level: null,
      coordinates: null,
      territory: null,
    });
  for (let number = 1; number <= 12; number++)
    add("facilities", {
      id: `3496-fortress-${number}`,
      name: `Fortress ${number}`,
      kind: "fortress",
      level: null,
      coordinates: null,
      territory: null,
    });
  for (const term of state.presidencies) {
    const rotationId = `3496-presidency-${term.date}`;
    const title = term.kind === "supreme_presidency" ? "Supreme presidency" : "Presidency";
    add("rotationSlots", {
      id: rotationId,
      kind: "presidency",
      facilityId: "3496-sunfire",
      allianceId: allianceId(term.allianceTag),
      playerId: null,
      playerName: term.playerName,
      startsAt: dayStart(term.date),
      endsAt: null,
      allDay: true,
      status: "completed",
      responsibility: title,
    });
    add("timelineEvents", {
      id: `3496-history-presidency-${term.date}`,
      title: `${title}: ${term.playerName}`,
      category: "presidency",
      description: `[${term.allianceTag}]`,
      eventDate: term.date,
      published: true,
    });
    add("calendarEvents", {
      id: `3496-calendar-presidency-${term.date}`,
      name: `${title}: ${term.playerName}`,
      kind: "presidency",
      allianceId: allianceId(term.allianceTag),
      rotationSlotId: rotationId,
      startsAt: dayStart(term.date),
      endsAt: nextDay(term.date),
      allDay: true,
      status: "completed",
      published: true,
    });
  }
  for (const event of state.events)
    add("calendarEvents", {
      id: `3496-event-${event.date}-${event.kind}`,
      name: event.name,
      kind: event.kind,
      startsAt: dayStart(event.date),
      endsAt: nextDay(event.date),
      allDay: true,
      status: "tentative",
      published: true,
    });

  add("transferGroups", {
    id: "3496-transfer-group-14",
    name: "Group 14",
    windowLabel: "October 2026",
    states: JSON.stringify(state.transferStates),
    published: true,
  });
  add("transferGuides", {
    id: "3496-transfer-checklist",
    title: "Transfer checklist",
    actionKind: "general",
    body: "Check your state group, entry requirements and available invitations in the game. Coordinate your move with the destination alliance before applying.",
    published: true,
    sortOrder: 1,
  });
  add("operationsContent", {
    id: "3496-operations-coordination",
    title: "State coordination",
    sectionKey: "coordination",
    body: "Use the alliance directory for rosters, the calendar for events and this page for structure assignments and presidency history.",
    published: true,
    sortOrder: 1,
  });
  add("operationsContent", {
    id: "3496-operations-handovers",
    title: "Structure handovers",
    sectionKey: "structures",
    body: "Record the responsible alliance, assignment dates and player in charge when a handover is agreed. Keep fortress, stronghold and castle assignments together so everyone can check the schedule.",
    published: true,
    sortOrder: 2,
  });
  add("announcements", {
    id: "3496-welcome",
    title: "State 3496 portal",
    body: "Alliance rosters, SvS results, events and state coordination in one place.",
    pinned: true,
    published: true,
  });
  add("mediaAssets", {
    id: "3496-hero",
    name: "State 3496 banner",
    kind: "image",
    url: "/images/state-hero.jpg",
    storagePath: "public/images/state-hero.jpg",
  });
  add("governanceDocuments", {
    id: "3496-governance",
    title: "State coordination",
    version: "1.0",
    status: "draft",
    summary: "Alliance responsibilities, event coordination and dispute handling.",
  });
  add("governanceSections", {
    id: "3496-governance-responsibilities",
    documentId: "3496-governance",
    title: "Responsibilities",
    anchor: "responsibilities",
    body: "Maintain alliance contacts and agreed responsibilities in the state directory.",
    sortOrder: 1,
  });

  // Fill optional columns explicitly so reruns restore nulls as well as populated values.
  for (const key of tableKeys)
    for (const row of data[key]) {
      const values = row as unknown as Record<string, unknown>;
      for (const [name, column] of Object.entries(getTableColumns(seedTables[key]))) {
        if (values[name] !== undefined) continue;
        values[name] =
          name === "createdAt" || name === "updatedAt"
            ? AS_OF
            : column.default !== undefined && typeof column.default !== "object"
              ? column.default
              : null;
      }
    }
  return data;
}
