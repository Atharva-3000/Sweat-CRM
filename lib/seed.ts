/**
 * Generates realistic demo data relative to "today" so the dashboard always
 * looks alive (people expiring this week, check-ins today, etc).
 */
import type { Attendance, Booking, Db, Expense, GymClass, Lead, Member, Message, Payment, Plan, Staff } from "./types";
import { addDays, daysBetween, lastNMonths, nextOccurrence, today } from "./dates";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_M = ["Rahul", "Amit", "Arjun", "Rohan", "Karan", "Vikas", "Siddharth", "Aditya", "Nikhil", "Manish", "Yash", "Harsh", "Kunal", "Pranav", "Varun", "Ankit", "Deepak", "Saurabh", "Ishaan", "Rajat", "Mohit", "Tushar", "Abhishek", "Gaurav"];
const FIRST_F = ["Priya", "Sneha", "Ananya", "Pooja", "Neha", "Kavya", "Riya", "Isha", "Divya", "Meera", "Shruti", "Tanvi", "Aditi", "Nisha", "Simran", "Ritika", "Sakshi", "Aishwarya", "Megha", "Payal"];
const LAST = ["Sharma", "Verma", "Patel", "Gupta", "Singh", "Mehta", "Iyer", "Reddy", "Nair", "Joshi", "Kulkarni", "Desai", "Chopra", "Malhotra", "Bansal", "Agarwal", "Kapoor", "Rao", "Shah", "Pillai", "Saxena", "Bhatia"];

export function generateSeed(): Db {
  const rnd = mulberry32(20261003);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)];
  const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
  const chance = (p: number) => rnd() < p;
  const phone = () => String(pick([9, 8, 7])) + String(int(100000000, 999999999));
  const T = today();

  const branches = [
    { id: "BR1", name: "Sweat Fitness 1.0 – Main Road", address: "12, Main Road, Sector 4", phone: "9876500001", manager: "Vikram Singh" },
    { id: "BR2", name: "Sweat Fitness 2.0 – City Centre", address: "2nd Floor, City Centre Mall", phone: "9876500002", manager: "Neha Kapoor" },
  ];
  const branchOpen: Record<string, string> = { BR1: addDays(T, -730), BR2: addDays(T, -120) };

  const plans: Plan[] = [
    { id: "PL01", name: "Monthly", durationDays: 30, price: 1500, description: "Full gym access for 1 month.", features: "Full Gym Access|Locker facility|Cardio equipment|Free parking", active: true },
    { id: "PL02", name: "Quarterly", durationDays: 90, price: 4000, description: "Full gym access for 3 months.", features: "Everything in Monthly|1 Free Diet Consultation|10% off supplements|Freeze up to 10 days", active: true },
    { id: "PL03", name: "Half-Yearly", durationDays: 180, price: 7000, description: "Full gym access + 2 diet consults.", features: "Everything in Quarterly|2 Free Diet Consultations|1 Free PT Session|Freeze up to 20 days", active: true },
    { id: "PL04", name: "Annual", durationDays: 365, price: 12000, description: "Full access + free merchandise.", features: "Everything in Half-Yearly|Free Gym Bag & T-shirt|Unlimited Group Classes|Freeze up to 30 days|Guest pass (1/month)", active: true },
    { id: "PL05", name: "Monthly + Personal Training", durationDays: 30, price: 4500, description: "Gym + 12 PT sessions.", features: "Full Gym Access|12 Personal Training Sessions|Custom Diet Plan|Weekly body analysis", active: true },
    { id: "PL06", name: "Student Monthly", durationDays: 30, price: 1200, description: "Valid student ID required.", features: "Full Gym Access|Locker facility|Off-peak hours only (10 AM - 4 PM)", active: true },
  ];
  const planWeights = ["PL01", "PL01", "PL01", "PL02", "PL02", "PL03", "PL04", "PL05", "PL06", "PL06"];

  const staff: Staff[] = [
    { id: "S001", name: "Vikram Singh", role: "Manager", phone: phone(), email: "vikram@powerhouse.in", branchId: "BR1", salary: 35000, joinDate: addDays(T, -700), specialization: "Operations", active: true },
    { id: "S002", name: "Neha Kapoor", role: "Manager", phone: phone(), email: "neha@powerhouse.in", branchId: "BR2", salary: 35000, joinDate: addDays(T, -130), specialization: "Operations", active: true },
    { id: "S003", name: "Raj Malhotra", role: "Trainer", phone: phone(), email: "raj@powerhouse.in", branchId: "BR1", salary: 25000, joinDate: addDays(T, -690), specialization: "Strength & Conditioning", active: true },
    { id: "S004", name: "Sunita Rao", role: "Trainer", phone: phone(), email: "sunita@powerhouse.in", branchId: "BR1", salary: 22000, joinDate: addDays(T, -500), specialization: "Yoga & Pilates", active: true },
    { id: "S005", name: "Imran Khan", role: "Trainer", phone: phone(), email: "imran@powerhouse.in", branchId: "BR1", salary: 24000, joinDate: addDays(T, -400), specialization: "CrossFit & HIIT", active: true },
    { id: "S006", name: "Aarav Mehta", role: "Trainer", phone: phone(), email: "aarav@powerhouse.in", branchId: "BR2", salary: 25000, joinDate: addDays(T, -125), specialization: "Bodybuilding", active: true },
    { id: "S007", name: "Kriti Nair", role: "Trainer", phone: phone(), email: "kriti@powerhouse.in", branchId: "BR2", salary: 23000, joinDate: addDays(T, -125), specialization: "Zumba & Dance Fitness", active: true },
    { id: "S008", name: "Dev Patel", role: "Trainer", phone: phone(), email: "dev@powerhouse.in", branchId: "BR2", salary: 22000, joinDate: addDays(T, -100), specialization: "Spin & Cardio", active: true },
    { id: "S009", name: "Pooja Shah", role: "Front Desk", phone: phone(), email: "frontdesk1@powerhouse.in", branchId: "BR1", salary: 15000, joinDate: addDays(T, -600), specialization: "", active: true },
    { id: "S010", name: "Ritesh Kumar", role: "Front Desk", phone: phone(), email: "frontdesk2@powerhouse.in", branchId: "BR2", salary: 15000, joinDate: addDays(T, -120), specialization: "", active: true },
    { id: "S011", name: "Ramesh", role: "Housekeeping", phone: phone(), email: "", branchId: "BR1", salary: 10000, joinDate: addDays(T, -650), specialization: "", active: true },
  ];
  const trainersByBranch: Record<string, string[]> = {
    BR1: staff.filter((s) => s.role === "Trainer" && s.branchId === "BR1").map((s) => s.id),
    BR2: staff.filter((s) => s.role === "Trainer" && s.branchId === "BR2").map((s) => s.id),
  };

  const members: Member[] = [];
  const payments: Payment[] = [];
  let payN = 0;
  const addPayment = (p: Omit<Payment, "id">) => payments.push({ id: `P${String(++payN).padStart(5, "0")}`, ...p });

  const MEMBER_COUNT = 140;
  for (let i = 1; i <= MEMBER_COUNT; i++) {
    const female = chance(0.42);
    const first = female ? pick(FIRST_F) : pick(FIRST_M);
    const last = pick(LAST);
    const branchId = chance(0.6) ? "BR1" : "BR2";
    
    const pickedPlanId = pick(planWeights);
    const plan = plans.find((p) => p.id === pickedPlanId)!;

    // Decide where in the lifecycle this member is.
    const r = rnd();
    let status: Member["status"] = "active";
    let endOffset: number;
    if (r < 0.1) endOffset = int(0, 7); // expiring this week
    else if (r < 0.22) endOffset = -int(1, 60); // expired
    else if (r < 0.26) {
      endOffset = int(10, plan.durationDays);
      status = "frozen";
    } else if (r < 0.28) {
      endOffset = -int(5, 40);
      status = "cancelled";
    } else endOffset = int(8, Math.max(9, plan.durationDays));

    let endDate = addDays(T, endOffset);
    let startDate = addDays(endDate, -(plan.durationDays - 1));
    if (startDate < branchOpen[branchId]) {
      startDate = addDays(branchOpen[branchId], int(0, 20));
      endDate = addDays(startDate, plan.durationDays - 1);
    }
    const maxRenewals = plan.durationDays <= 30 ? 10 : plan.durationDays <= 90 ? 4 : 1;
    let renewals = int(0, maxRenewals);
    while (renewals > 0 && addDays(startDate, -renewals * plan.durationDays) < branchOpen[branchId]) renewals--;
    const joinDate = addDays(startDate, -renewals * plan.durationDays);

    const id = `M${String(i).padStart(4, "0")}`;
    const hasDue = chance(0.14);
    const due = hasDue ? pick([500, 1000, 1500]) : 0;

    // Payment history: one per period.
    for (let k = 0; k <= renewals; k++) {
      const pDate = addDays(joinDate, k * plan.durationDays);
      const isLast = k === renewals;
      const discount = chance(0.2) ? pick([100, 200, 500]) : 0;
      addPayment({
        memberId: id,
        branchId,
        date: pDate,
        amount: Math.max(0, plan.price - discount - (isLast ? due : 0)),
        method: pick(["UPI", "UPI", "UPI", "Cash", "Cash", "Card"]),
        type: k === 0 ? "New" : "Renewal",
        planId: plan.id,
        note: discount ? `Discount ₹${discount}` : "",
      });
    }

    const dobYear = new Date().getFullYear() - int(18, 50);
    // Make a handful of birthdays land this week.
    const dob = chance(0.05)
      ? `${dobYear}-${addDays(T, int(0, 6)).slice(5)}`
      : `${dobYear}-${String(int(1, 12)).padStart(2, "0")}-${String(int(1, 28)).padStart(2, "0")}`;

    members.push({
      id,
      name: `${first} ${last}`,
      phone: phone(),
      email: `${first}.${last}${int(1, 99)}@gmail.com`.toLowerCase(),
      gender: female ? "Female" : "Male",
      dob,
      address: pick(["Sector 4", "Sector 9", "Green Park", "MG Road", "Lake View", "Station Road", "Model Town", "Civil Lines"]),
      branchId,
      planId: plan.id,
      trainerId: plan.id === "PL05" || chance(0.25) ? pick(trainersByBranch[branchId]) : "",
      joinDate,
      startDate,
      endDate,
      status,
      frozenOn: status === "frozen" ? addDays(T, -int(2, 20)) : "",
      balanceDue: due,
      emergencyContact: phone(),
      notes: chance(0.1) ? pick(["Knee injury – avoid heavy squats", "Wants weight loss program", "Prefers morning slot", "Referred by a friend"]) : "",
    });
  }

  // Attendance for the last 30 days.
  const attendance: Attendance[] = [];
  let attN = 0;
  const nowHour = new Date().getHours();
  const hours = [6, 6, 7, 7, 7, 8, 8, 9, 10, 11, 16, 17, 18, 18, 18, 19, 19, 19, 20, 20, 21];
  for (const m of members) {
    const live = m.status === "active" && m.endDate >= T;
    if (!live) continue;
    const ghost = chance(0.15); // hasn't come in for a while
    const freq = 0.3 + rnd() * 0.5;
    for (let d = 30; d >= 0; d--) {
      if (ghost && d < 18) continue;
      const date = addDays(T, -d);
      if (date < m.startDate && date < m.joinDate) continue;
      if (!chance(freq)) continue;
      const h = pick(hours);
      if (d === 0 && h > nowHour) continue;
      attendance.push({
        id: `A${String(++attN).padStart(6, "0")}`,
        memberId: m.id,
        branchId: m.branchId,
        date,
        time: `${String(h).padStart(2, "0")}:${String(int(0, 59)).padStart(2, "0")}`,
      });
    }
  }
  attendance.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  attendance.forEach((a, i) => (a.id = `A${String(i + 1).padStart(6, "0")}`));

  // Leads / enquiries.
  const leads: Lead[] = [];
  const interests = ["Weight loss", "Muscle gain", "General fitness", "Yoga", "Zumba", "Personal training", "Annual plan enquiry"];
  for (let i = 1; i <= 32; i++) {
    const female = chance(0.45);
    const status = pick(["New", "New", "Contacted", "Contacted", "Trial", "Converted", "Lost"]);
    const createdAt = addDays(T, -int(0, 40));
    leads.push({
      id: `L${String(i).padStart(3, "0")}`,
      name: `${female ? pick(FIRST_F) : pick(FIRST_M)} ${pick(LAST)}`,
      phone: phone(),
      email: chance(0.6) ? `lead${i}@gmail.com` : "",
      branchId: chance(0.5) ? "BR1" : "BR2",
      source: pick(["Walk-in", "Instagram", "Instagram", "Referral", "Google", "Website", "Flyer"]),
      interest: pick(interests),
      status,
      followUpDate: status === "Converted" || status === "Lost" ? "" : addDays(T, int(-3, 7)),
      createdAt,
      notes: chance(0.3) ? pick(["Asked about couple discount", "Will visit on weekend", "Price sensitive", "Wants trial session first"]) : "",
    });
  }

  // Classes & bookings.
  const classDefs: [string, string, string, string, number, number][] = [
    // name, branch, day, time, duration, capacity
    ["Morning Yoga", "BR1", "Mon", "07:00", 60, 20],
    ["Morning Yoga", "BR1", "Wed", "07:00", 60, 20],
    ["Morning Yoga", "BR1", "Fri", "07:00", 60, 20],
    ["HIIT Blast", "BR1", "Tue", "18:30", 45, 15],
    ["HIIT Blast", "BR1", "Thu", "18:30", 45, 15],
    ["CrossFit WOD", "BR1", "Sat", "08:00", 60, 12],
    ["Pilates Core", "BR1", "Sun", "09:00", 50, 15],
    ["Zumba Party", "BR2", "Mon", "19:00", 60, 25],
    ["Zumba Party", "BR2", "Thu", "19:00", 60, 25],
    ["Spin Class", "BR2", "Tue", "07:00", 45, 14],
    ["Spin Class", "BR2", "Fri", "07:00", 45, 14],
    ["Bodybuilding 101", "BR2", "Wed", "18:00", 60, 12],
    ["Weekend Bootcamp", "BR2", "Sat", "07:30", 60, 20],
  ];
  const trainerFor = (name: string, branch: string) => {
    const map: Record<string, string> = {
      "Morning Yoga": "S004",
      "Pilates Core": "S004",
      "HIIT Blast": "S005",
      "CrossFit WOD": "S005",
      "Zumba Party": "S007",
      "Spin Class": "S008",
      "Bodybuilding 101": "S006",
      "Weekend Bootcamp": "S006",
    };
    return map[name] ?? trainersByBranch[branch][0];
  };
  const classes: GymClass[] = classDefs.map(([name, branchId, day, time, durationMin, capacity], i) => ({
    id: `C${String(i + 1).padStart(3, "0")}`,
    name,
    branchId,
    trainerId: trainerFor(name, branchId),
    day,
    time,
    durationMin,
    capacity,
  }));
  const bookings: Booking[] = [];
  let bkN = 0;
  for (const c of classes) {
    const date = nextOccurrence(c.day, T);
    const pool = members.filter((m) => m.branchId === c.branchId && m.status === "active" && m.endDate >= date);
    const count = Math.min(pool.length, Math.floor(c.capacity * (0.4 + rnd() * 0.6)));
    const chosen = [...pool].sort(() => rnd() - 0.5).slice(0, count);
    for (const m of chosen) {
      bookings.push({ id: `B${String(++bkN).padStart(5, "0")}`, classId: c.id, memberId: m.id, date, status: "booked" });
    }
  }

  // Expenses (monthly) since each branch opened.
  const expenses: Expense[] = [];
  let exN = 0;
  const addExpense = (e: Omit<Expense, "id">) => expenses.push({ id: `E${String(++exN).padStart(4, "0")}`, ...e });
  for (const mk of lastNMonths(6, T)) {
    for (const b of branches) {
      const first = `${mk}-01`;
      if (first < branchOpen[b.id].slice(0, 7) + "-01") continue;
      const date5 = `${mk}-05`;
      if (date5 > T) continue;
      addExpense({ branchId: b.id, date: date5, category: "Rent", amount: b.id === "BR1" ? 60000 : 85000, note: "Monthly rent" });
      const salaries = staff.filter((s) => s.branchId === b.id).reduce((a, s) => a + s.salary, 0);
      addExpense({ branchId: b.id, date: `${mk}-01`, category: "Salaries", amount: salaries, note: "Staff salaries" });
      const d12 = `${mk}-12`;
      if (d12 <= T) addExpense({ branchId: b.id, date: d12, category: "Electricity", amount: int(12, 22) * 1000, note: "Electricity bill" });
      if (chance(0.6)) {
        const d = `${mk}-${String(int(14, 26)).padStart(2, "0")}`;
        if (d <= T) addExpense({ branchId: b.id, date: d, category: pick(["Maintenance", "Equipment", "Marketing", "Supplies"]), amount: int(2, 25) * 500, note: pick(["Treadmill servicing", "New dumbbells", "Instagram ads", "Cleaning supplies", "AC repair", "Flyers printing"]) });
      }
    }
  }

  const sample = members.filter((m) => daysBetween(T, m.endDate) >= 0 && daysBetween(T, m.endDate) <= 7).slice(0, 3);
  const messages: Message[] = sample.map((m, i) => ({
    id: `MSG${String(i + 1).padStart(5, "0")}`,
    channel: "whatsapp",
    recipientName: m.name,
    to: m.phone,
    refType: "member",
    refId: m.id,
    subject: "",
    body: `Hi ${m.name.split(" ")[0]}, your membership at Sweat Fitness expires soon. Renew now to keep your streak going 💪`,
    sentAt: `${addDays(T, -1)} 10:${String(10 + i).padStart(2, "0")}`,
    status: "Sent (mock)",
  }));

  return {
    settings: [
      { key: "gymName", value: "Sweat Fitness" },
      { key: "ownerName", value: "Owner" },
      { key: "reminderDays", value: "7" },
      { key: "countryCode", value: "91" },
    ],
    branches,
    plans,
    members,
    payments,
    attendance,
    staff,
    leads,
    classes,
    bookings,
    expenses,
    messages,
    callLogs: [],
  };
}
