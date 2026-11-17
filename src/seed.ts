import { Session } from "./models/session";
import { Teacher } from "./models/teacher";
import { User } from "./models/user";
import { createUser } from "./services/user.service";

const HOUR_MS = 60 * 60 * 1000;
const SESSION_DATES = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"];
const SLOT_HOURS_UTC = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

const teachers = [
  {
    fullName: "Asha Rao",
    email: "asha.rao@example.com",
    specialization: "Mathematics",
    experience: 8,
  },
  {
    fullName: "Daniel Cho",
    email: "daniel.cho@example.com",
    specialization: "Physics",
    experience: 5,
  },
  {
    fullName: "Maria Lopez",
    email: "maria.lopez@example.com",
    specialization: "English",
    experience: 12,
  },
];

const testUser = {
  fullName: "Test User",
  email: "test@mail.com",
  phone: "+15550000000",
  password: "Pass@123",
};

async function seedTeachers() {
  const ids = [];
  for (const data of teachers) {
    const existing = await Teacher.findOne({ email: data.email });
    const teacher = existing ?? (await Teacher.create(data));
    console.log(
      `Teacher ${existing ? "exists, skipped" : "created"}: ${teacher._id} ${teacher.fullName} (${teacher.specialization})`,
    );
    ids.push(teacher._id);
  }
  return ids;
}

async function seedTestUser() {
  const existing = await User.findOne({ email: testUser.email });
  const user = existing ?? (await createUser(testUser));
  console.log(
    `User ${existing ? "exists, skipped" : "created"}: ${user._id} ${user.email}`,
  );
}

async function seedSessions(teacherIds: unknown[]) {
  let created = 0;
  let skipped = 0;
  for (const [day, date] of SESSION_DATES.entries()) {
    for (const [slot, hour] of SLOT_HOURS_UTC.entries()) {
      const teacherId = teacherIds[(day + slot) % teacherIds.length];
      const startTime = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00.000Z`);
      if (await Session.exists({ teacherId, startTime })) {
        skipped++;
        continue;
      }
      await Session.create({
        teacherId,
        startTime,
        endTime: new Date(startTime.getTime() + HOUR_MS),
      });
      created++;
    }
  }
  console.log(`Sessions: ${created} created, ${skipped} skipped`);
}

export async function seed() {
  const teacherIds = await seedTeachers();
  await seedTestUser();
  await seedSessions(teacherIds);
}
