import { db } from "./index";
import {
  stateSettings,
  alliances,
  svsCycles,
  creators,
  announcements,
  transferWindows,
  transferGuides,
  timelineEvents,
  governanceDocuments,
  operationsContent,
} from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Insert state settings
  await db.insert(stateSettings).values({
    id: "state-3496",
    stateNumber: 3496,
    displayName: "State 3496",
    tagline: "Frozen frontier, united we stand",
    timezone: "UTC",
    discordUrl: "https://discord.gg/example",
    launchDate: "2024-01-15",
    heroGeneration: "Generation 8",
    currentEvent: "Winter Festival",
    nextEventDate: "2024-12-25T00:00:00Z",
    recruitingStatus: "Open",
    transferGroup: "Group A",
    transferSpots: 50,
    eligibilityRange: "1-100M",
    disclaimer: "Unofficial fan community. Not affiliated with the game publisher.",
    socialLinks: JSON.stringify([
      { label: "Discord", url: "https://discord.gg/example" },
    ]),
  });

  // Insert sample alliances
  await db.insert(alliances).values([
    {
      id: "alliance-1",
      name: "Frost Vanguard",
      slug: "frost-vanguard",
      tag: "FROST",
      description: "Premier alliance focused on competitive gameplay and community growth.",
      shortDescription: "Premier competitive alliance",
      power: 1500000000,
      openSpots: 25,
      recruitingStatus: "open",
      playstyle: "Competitive",
      timezoneLabel: "UTC+0",
      discordUrl: "https://discord.gg/frost",
      svsContribution: "Top 3 in state",
      published: true,
      sortRank: 1,
    },
    {
      id: "alliance-2",
      name: "Winter Coalition",
      slug: "winter-coalition",
      tag: "WINT",
      description: "Friendly alliance welcoming players of all levels.",
      shortDescription: "Casual and welcoming",
      power: 800000000,
      openSpots: 40,
      recruitingStatus: "open",
      playstyle: "Casual",
      timezoneLabel: "UTC+1",
      published: true,
      sortRank: 2,
    },
    {
      id: "alliance-3",
      name: "Iron Wolves",
      slug: "iron-wolves",
      tag: "IWOLF",
      description: "Hardcore PvP alliance focused on domination.",
      shortDescription: "Elite PvP force",
      power: 2000000000,
      openSpots: 10,
      recruitingStatus: "invite_only",
      playstyle: "Hardcore",
      timezoneLabel: "UTC-5",
      published: true,
      sortRank: 3,
    },
  ]);

  // Insert SVS cycles
  await db.insert(svsCycles).values([
    {
      id: "svs-1",
      slug: "vs-state-3500",
      opponent: "State 3500",
      eventDate: "2024-12-01",
      prepScore: 2500000,
      prepResult: "win",
      battleScore: 3200000,
      opponentBattleScore: 2800000,
      battleResult: "win",
      storyTitle: "Victory at the Frozen Pass",
      storyIntro: "Our forces achieved a decisive victory...",
      storyBody: "Full battle report content here...",
      published: true,
    },
    {
      id: "svs-2",
      slug: "vs-state-3499",
      opponent: "State 3499",
      eventDate: "2024-11-15",
      prepScore: 1800000,
      prepResult: "loss",
      battleScore: 2100000,
      opponentBattleScore: 2400000,
      battleResult: "loss",
      storyTitle: "Tough Battle in the North",
      storyIntro: "We faced strong opposition...",
      storyBody: "Full battle report content here...",
      published: true,
    },
  ]);

  // Insert creators
  await db.insert(creators).values([
    {
      id: "creator-1",
      name: "FrostByte Gaming",
      handle: "@frostbyte",
      platform: "YouTube",
      contentType: "Strategy Guides",
      bio: "Top strategy content creator for State 3496",
      url: "https://youtube.com/frostbyte",
      featured: true,
      published: true,
      sortOrder: 1,
    },
    {
      id: "creator-2",
      name: "Winter Plays",
      handle: "@winterplays",
      platform: "Twitch",
      contentType: "Live Streams",
      bio: "Daily streams of state events",
      url: "https://twitch.tv/winterplays",
      featured: true,
      published: true,
      sortOrder: 2,
    },
  ]);

  // Insert announcements
  await db.insert(announcements).values([
    {
      id: "announce-1",
      title: "Welcome to State 3496!",
      body: "We're excited to have you join our community. Check out the guides and resources available.",
      pinned: true,
      published: true,
    },
  ]);

  // Insert transfer windows
  await db.insert(transferWindows).values([
    {
      id: "transfer-1",
      name: "Winter Transfer Window",
      transferType: "incoming",
      status: "open",
      phase: "Power Reduction",
      startsAt: "2024-12-01T00:00:00Z",
      endsAt: "2024-12-15T00:00:00Z",
      openSpots: 50,
      eligibilityRange: "1-100M",
      published: true,
      sortOrder: 1,
    },
  ]);

  // Insert transfer guides
  await db.insert(transferGuides).values([
    {
      id: "guide-1",
      title: "Power Reduction Guide",
      actionKind: "power_reduction",
      body: "To transfer successfully, you need to reduce your power below the cap...",
      riskNote: "Make sure to use all resources before reducing!",
      published: true,
      sortOrder: 1,
    },
  ]);

  // Insert timeline events
  await db.insert(timelineEvents).values([
    {
      id: "timeline-1",
      title: "State Launch",
      category: "Events",
      description: "State 3496 officially launches",
      eventDate: "2024-01-15",
      serverDay: 1,
      published: true,
    },
    {
      id: "timeline-2",
      title: "First Alliance Formed",
      category: "Milestones",
      description: "Frost Vanguard becomes the first alliance",
      eventDate: "2024-01-20",
      serverDay: 5,
      published: true,
    },
  ]);

  // Insert governance documents
  await db.insert(governanceDocuments).values([
    {
      id: "gov-1",
      title: "State Constitution",
      version: "1.0",
      status: "active",
      summary: "The fundamental laws governing State 3496",
      effectiveDate: "2024-01-15",
    },
  ]);

  // Insert operations content
  await db.insert(operationsContent).values([
    {
      id: "ops-1",
      title: "Rally Call Etiquette",
      sectionKey: "etiquette",
      body: "When joining rallies, always follow the rally leader's instructions...",
      published: true,
      sortOrder: 1,
    },
    {
      id: "ops-2",
      title: "Communications Guide",
      sectionKey: "comms",
      body: "How to use state chat effectively and professionally...",
      published: true,
      sortOrder: 2,
    },
  ]);

  console.log("✅ Database seeded successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
