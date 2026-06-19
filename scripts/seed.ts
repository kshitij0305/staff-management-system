/**
 * Demo data seed — run with `npm run db:seed`.
 * Seeds TWO tenants to prove isolation + configurable hierarchies:
 *   • "VK Group Solar"  — 5 levels (Owner → National Head → CSM → ASM → CPE)
 *   • "Acme Realty"     — 3 levels (Director → Manager → Agent)
 * Deterministic (fixed PRNG seed). Wipes existing data first.
 */
import { PrismaClient, ProspectStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------- deterministic PRNG ----------
let rngState = 0x9e3779b9;
function rand(): number {
  rngState |= 0;
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

const FIRST = [
  "Aarav", "Vivaan", "Aditya", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Rohan", "Kabir",
  "Ananya", "Diya", "Aadhya", "Kavya", "Ishita", "Priya", "Sneha", "Pooja", "Neha", "Riya",
  "Rahul", "Amit", "Suresh", "Ramesh", "Vikram", "Manoj", "Deepak", "Sanjay", "Anil", "Rajiv",
  "Sunita", "Geeta", "Meena", "Asha", "Rekha", "Lakshmi", "Sita", "Radha", "Kiran", "Swati",
];
const LAST = [
  "Sharma", "Verma", "Gupta", "Mehta", "Patel", "Singh", "Kumar", "Yadav", "Joshi", "Mishra",
  "Agarwal", "Chauhan", "Tiwari", "Pandey", "Saxena", "Malhotra", "Kapoor", "Bose", "Reddy", "Nair",
];
const PLACES: Record<string, string[]> = {
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
};
const STATES = Object.keys(PLACES);
const STREETS = ["MG Road", "Station Road", "Gandhi Nagar", "Civil Lines", "Sector 12", "Nehru Colony"];
const REMARKS_INTERESTED = ["Wants a quote, very keen", "Ready to book", "Site visit scheduled"];
const REMARKS_NOT = ["Budget constraints", "Not interested right now", "Already has a provider"];
const REMARKS_FOLLOW = ["Call back next week", "Discussing with family", "Needs more info"];

const used = new Set<string>();
function uniqueName(): string {
  for (let i = 0; i < 300; i++) {
    const n = `${pick(FIRST)} ${pick(LAST)}`;
    if (!used.has(n)) {
      used.add(n);
      return n;
    }
  }
  const n = `${pick(FIRST)} ${pick(LAST)} ${used.size}`;
  used.add(n);
  return n;
}
function phone(): string {
  return `9${String(randInt(100000000, 999999999))}`;
}
function daysAgo(days: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, randInt(0, 59), 0, 0);
  return d;
}

let employeeCounter = 0;
function nextEmployeeId(): string {
  employeeCounter += 1;
  return `EMP-${String(employeeCounter).padStart(4, "0")}`;
}

interface LevelSpec {
  name: string;
  count: number; // how many users at this level
  email?: string; // demo login for the first user at this level
}

/** Build one tenant: levels top→bottom, users distributed under the level above. */
async function buildOrg(args: {
  name: string;
  slug: string;
  state: string;
  levels: LevelSpec[]; // index 0 = top (seesAll)
  passwordHash: string;
}) {
  const { name, slug, state, levels: specs, passwordHash } = args;
  const n = specs.length;

  const org = await prisma.organization.create({
    data: { name, slug, onboarded: true },
  });

  // Levels: top = rank n (seesAll) … leaf = rank 1.
  const levelByIndex = await Promise.all(
    specs.map((s, i) =>
      prisma.level.create({
        data: { orgId: org.id, name: s.name, rank: n - i, seesAll: i === 0 },
      })
    )
  );

  // Create users level by level, round-robin under the previous level.
  let prevLevelUsers: { id: string; ancestorIds: string[] }[] = [];
  let leafUsers: { id: string; city: string; state: string }[] = [];

  for (let i = 0; i < n; i++) {
    const spec = specs[i];
    const level = levelByIndex[i];
    const created: { id: string; ancestorIds: string[] }[] = [];

    for (let k = 0; k < spec.count; k++) {
      const manager = i === 0 ? null : prevLevelUsers[k % prevLevelUsers.length];
      const ancestorIds = manager ? [...manager.ancestorIds, manager.id] : [];
      const city = pick(PLACES[state]);
      const u = await prisma.user.create({
        data: {
          organizationId: org.id,
          levelId: level.id,
          employeeId: nextEmployeeId(),
          name: uniqueName(),
          email: k === 0 && spec.email ? spec.email : `${slug}.${nextEmployeeId().toLowerCase()}@example.com`,
          phone: phone(),
          passwordHash,
          managerId: manager?.id ?? null,
          ancestorIds,
          joiningDate: daysAgo(randInt(30, 1200)),
          city,
          state,
          avatarSeed: slug + k,
        },
        select: { id: true, ancestorIds: true },
      });
      created.push(u);
      if (i === n - 1) leafUsers.push({ id: u.id, city, state });
    }
    prevLevelUsers = created;
  }

  // Prospects for leaf users (weighted toward the last 3 days).
  const statusWeighted: ProspectStatus[] = [
    ...Array(40).fill(ProspectStatus.INTERESTED),
    ...Array(26).fill(ProspectStatus.NOT_INTERESTED),
    ...Array(34).fill(ProspectStatus.FOLLOW_UP),
  ];
  const prospectRows = [];
  for (const leaf of leafUsers) {
    const count = randInt(6, 24);
    for (let i = 0; i < count; i++) {
      const day = rand() < 0.35 ? randInt(0, 3) : randInt(0, 60);
      const status = pick(statusWeighted);
      prospectRows.push({
        organizationId: org.id,
        customerName: uniqueName(),
        phone: phone(),
        address: `${randInt(1, 220)}, ${pick(STREETS)}`,
        city: leaf.city,
        state: leaf.state,
        visitDate: daysAgo(day, randInt(9, 18)),
        status,
        remarks:
          status === ProspectStatus.INTERESTED
            ? pick(REMARKS_INTERESTED)
            : status === ProspectStatus.NOT_INTERESTED
              ? pick(REMARKS_NOT)
              : pick(REMARKS_FOLLOW),
        collectedById: leaf.id,
        createdAt: daysAgo(day, 19),
      });
    }
  }
  await prisma.prospect.createMany({ data: prospectRows });

  return { org, employees: employeeCounter, prospects: prospectRows.length };
}

async function main() {
  console.log("Clearing existing data…");
  await prisma.activityLog.deleteMany();
  await prisma.prospect.deleteMany();
  await prisma.user.updateMany({ data: { managerId: null } });
  await prisma.user.deleteMany();
  await prisma.level.deleteMany();
  await prisma.organization.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  console.log("Seeding tenant: VK Group Solar (5 levels)…");
  const vk = await buildOrg({
    name: "VK Group Solar",
    slug: "vk-group-solar",
    state: "Uttar Pradesh",
    passwordHash,
    levels: [
      { name: "Owner", count: 1, email: "owner@vkgroup.in" },
      { name: "National Head", count: 1, email: "nationalhead@vkgroup.in" },
      { name: "CSM", count: 3, email: "csm@vkgroup.in" },
      { name: "ASM", count: 9, email: "asm@vkgroup.in" },
      { name: "CPE", count: 30, email: "cpe@vkgroup.in" },
    ],
  });

  console.log("Seeding tenant: Acme Realty (3 levels)…");
  const acme = await buildOrg({
    name: "Acme Realty",
    slug: "acme-realty",
    state: "Maharashtra",
    passwordHash,
    levels: [
      { name: "Director", count: 1, email: "director@acme.in" },
      { name: "Manager", count: 3, email: "manager@acme.in" },
      { name: "Agent", count: 9, email: "agent@acme.in" },
    ],
  });

  console.log("\nSeed complete ✔");
  console.log(`VK Group Solar: prospects=${vk.prospects} · Acme Realty: prospects=${acme.prospects}`);
  console.log("Demo logins (password: demo1234):");
  console.log("  Tenant A — owner@vkgroup.in · asm@vkgroup.in · cpe@vkgroup.in");
  console.log("  Tenant B — director@acme.in · manager@acme.in · agent@acme.in");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
