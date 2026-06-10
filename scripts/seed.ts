/**
 * Demo data seed — run with `npm run db:seed`.
 * Deterministic (fixed PRNG seed) so re-runs produce the same company.
 * Wipes existing data first.
 */
import { PrismaClient, Role, ProspectStatus } from "@prisma/client";
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

// ---------- name + place pools ----------
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
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Karnal"],
};
const STATES = Object.keys(PLACES);
const STREETS = ["MG Road", "Station Road", "Gandhi Nagar", "Civil Lines", "Sector 12", "Nehru Colony", "Shastri Marg", "Patel Chowk"];
const REMARKS_INTERESTED = [
  "Wants rooftop quote for 3kW system",
  "Asked for EMI options, very keen",
  "Site visit scheduled, roof looks suitable",
  "Comparing with one other vendor, leaning towards us",
  "Ready to book after subsidy explanation",
];
const REMARKS_NOT = [
  "Renting the property, owner not interested",
  "Budget constraints this year",
  "Already installed solar last year",
  "Roof shading issue, not feasible",
];
const REMARKS_FOLLOW = [
  "Asked to call back next week",
  "Wants to discuss with family first",
  "Needs electricity bill analysis before deciding",
  "Interested but traveling, follow up after 10 days",
];

const usedNames = new Set<string>();
function uniqueName(): string {
  for (let i = 0; i < 200; i++) {
    const n = `${pick(FIRST)} ${pick(LAST)}`;
    if (!usedNames.has(n)) {
      usedNames.add(n);
      return n;
    }
  }
  const n = `${pick(FIRST)} ${pick(LAST)} ${usedNames.size}`;
  usedNames.add(n);
  return n;
}

function emailFor(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@vkgroup.in`;
}
function phone(): string {
  return `9${String(randInt(100000000, 999999999))}`;
}

let employeeCounter = 0;
function nextEmployeeId(): string {
  employeeCounter += 1;
  return `VK-${String(employeeCounter).padStart(4, "0")}`;
}

function daysAgo(days: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, randInt(0, 59), 0, 0);
  return d;
}

async function main() {
  console.log("Clearing existing data…");
  await prisma.activityLog.deleteMany();
  await prisma.prospect.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  interface CreateArgs {
    name: string;
    email?: string;
    role: Role;
    manager?: { id: string; ancestorIds: string[] } | null;
    joinedDaysAgo: number;
    state?: string;
  }
  async function createUser(args: CreateArgs) {
    const state = args.state ?? pick(STATES);
    const user = await prisma.user.create({
      data: {
        employeeId: nextEmployeeId(),
        name: args.name,
        email: args.email ?? emailFor(args.name),
        phone: phone(),
        passwordHash,
        role: args.role,
        managerId: args.manager?.id ?? null,
        ancestorIds: args.manager ? [...args.manager.ancestorIds, args.manager.id] : [],
        joiningDate: daysAgo(args.joinedDaysAgo),
        city: pick(PLACES[state]),
        state,
        avatarSeed: args.name,
      },
    });
    return user;
  }

  console.log("Creating hierarchy…");
  const chairman = await createUser({
    name: "Vinod Khanna",
    email: "chairman@vkgroup.in",
    role: Role.CHAIRMAN,
    manager: null,
    joinedDaysAgo: 1500,
    state: "Uttar Pradesh",
  });
  const nationalHead = await createUser({
    name: "Rajesh Verma",
    email: "nationalhead@vkgroup.in",
    role: Role.NATIONAL_HEAD,
    manager: chairman,
    joinedDaysAgo: 1200,
    state: "Uttar Pradesh",
  });

  const csms = [];
  for (let i = 0; i < 3; i++) {
    csms.push(
      await createUser({
        name: uniqueName(),
        email: i === 0 ? "csm@vkgroup.in" : undefined,
        role: Role.CSM,
        manager: nationalHead,
        joinedDaysAgo: randInt(600, 1000),
        state: STATES[i * 2],
      })
    );
  }

  const asms = [];
  for (const csm of csms) {
    for (let i = 0; i < 3; i++) {
      asms.push(
        await createUser({
          name: uniqueName(),
          email: asms.length === 0 ? "asm@vkgroup.in" : undefined,
          role: Role.ASM,
          manager: csm,
          joinedDaysAgo: randInt(300, 600),
          state: csm.state ?? undefined,
        })
      );
    }
  }

  const cpes = [];
  for (const asm of asms) {
    const count = randInt(3, 4);
    for (let i = 0; i < count; i++) {
      cpes.push(
        await createUser({
          name: uniqueName(),
          email: cpes.length === 0 ? "cpe@vkgroup.in" : undefined,
          role: Role.CPE,
          manager: asm,
          joinedDaysAgo: randInt(30, 300),
          state: asm.state ?? undefined,
        })
      );
    }
  }

  // A couple of inactive employees for realism
  await prisma.user.update({ where: { id: cpes[cpes.length - 1].id }, data: { status: "INACTIVE" } });
  await prisma.user.update({ where: { id: cpes[cpes.length - 7].id }, data: { status: "INACTIVE" } });

  console.log(`Created ${employeeCounter} employees. Creating prospects…`);

  const statusWeighted: ProspectStatus[] = [
    ...Array(40).fill(ProspectStatus.INTERESTED),
    ...Array(26).fill(ProspectStatus.NOT_INTERESTED),
    ...Array(34).fill(ProspectStatus.FOLLOW_UP),
  ];

  const prospectRows = [];
  for (const cpe of cpes) {
    // Per-CPE skill level → between ~8 and ~35 prospects over 60 days
    const total = randInt(8, 35);
    for (let i = 0; i < total; i++) {
      // Weight towards recent days so "last 3 days" defaults show data
      const day = rand() < 0.35 ? randInt(0, 3) : randInt(0, 60);
      const status = pick(statusWeighted);
      const customer = uniqueName();
      const state = cpe.state ?? pick(STATES);
      prospectRows.push({
        customerName: customer,
        phone: phone(),
        address: `${randInt(1, 220)}, ${pick(STREETS)}`,
        city: cpe.city ?? pick(PLACES[state]),
        state,
        visitDate: daysAgo(day, randInt(9, 18)),
        status,
        remarks:
          status === ProspectStatus.INTERESTED
            ? pick(REMARKS_INTERESTED)
            : status === ProspectStatus.NOT_INTERESTED
              ? pick(REMARKS_NOT)
              : pick(REMARKS_FOLLOW),
        collectedById: cpe.id,
        createdAt: daysAgo(day, 19),
      });
    }
  }
  await prisma.prospect.createMany({ data: prospectRows });
  console.log(`Created ${prospectRows.length} prospects. Writing activity logs…`);

  const logs = [];
  for (const u of [chairman, nationalHead, ...csms, ...asms, ...cpes]) {
    logs.push({
      actorId: u.managerId ?? chairman.id,
      action: "EMPLOYEE_CREATED",
      targetType: "USER",
      targetId: u.id,
      summary: `added ${u.name} as ${u.role.replace("_", " ").toLowerCase()}`,
      createdAt: u.joiningDate,
    });
  }
  // Recent prospect activity (latest 120)
  const recent = await prisma.prospect.findMany({
    orderBy: { createdAt: "desc" },
    take: 120,
    include: { collectedBy: { select: { id: true, name: true } } },
  });
  for (const p of recent) {
    logs.push({
      actorId: p.collectedBy.id,
      action: "PROSPECT_ADDED",
      targetType: "PROSPECT",
      targetId: p.id,
      summary: `added prospect ${p.customerName} (${p.city})`,
      createdAt: p.createdAt,
    });
  }
  await prisma.activityLog.createMany({ data: logs });

  console.log("\nSeed complete ✔");
  console.log("Demo logins (password: demo1234):");
  console.log("  chairman@vkgroup.in       — Chairman");
  console.log("  nationalhead@vkgroup.in   — National Head");
  console.log("  csm@vkgroup.in            — CSM");
  console.log("  asm@vkgroup.in            — ASM");
  console.log("  cpe@vkgroup.in            — CPE");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
