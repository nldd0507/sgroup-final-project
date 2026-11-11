import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/passwordHelper.js";

// ---------------------------------------------------------------------------
// SEED — RESET toàn bộ dữ liệu rồi tạo lại với ID CỐ ĐỊNH
//
// Mỗi lần chạy `npm run db:seed`:
//   1. TRUNCATE mọi bảng + RESTART IDENTITY → id bắt đầu lại từ 1
//   2. Tạo dữ liệu theo đúng thứ tự bên dưới → id luôn giống nhau
// Nhờ vậy tài liệu test (docs/seed-test-guide.md) ghi được id chính xác.
// Mật khẩu chung cho mọi tài khoản: Password123!
// ---------------------------------------------------------------------------

const prisma = new PrismaClient();
const PASSWORD = "Password123!";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const NOW = Date.now();
const daysFromNow = (days) => new Date(NOW + days * DAY);
const dateOnly = (days) => new Date(daysFromNow(days).toISOString().slice(0, 10));
const notAfterNow = (date) => new Date(Math.min(date.getTime(), NOW - HOUR));

// ---------------------------------------------------------------------------
// USERS — id cố định. "Mentor" KHÔNG phải role: tất cả mentor đều là MEMBER,
// chỉ khác ở chỗ được gán làm classes.mentor_id.
// ---------------------------------------------------------------------------
const MEMBER_NAMES = [
  // member2 … member30  (id = số thứ tự + 8, ví dụ member2 → id 10)
  "Nguyen Van An", "Tran Thi Binh", "Le Hoang Cuong", "Pham Minh Duc", "Vo Thanh Em",
  "Dang Gia Huy", "Bui Khong Lop", "Hoang Thi Giang", "Do Quang Hai", "Ngo Thu Hien",
  "Duong Van Khoa", "Ly Thi Lan", "Mai Duc Long", "Trinh Bao Ngoc", "Phan Van Phuc",
  "Cao Thi Quynh", "Ha Minh Quan", "Vu Thi Suong", "Dinh Cong Tai", "Luu Thanh Tam",
  "Kieu Van Thang", "Ton Nu Thao", "Chau Minh Tri", "Lam Thi Uyen", "Quach Van Vinh",
  "To Thi Xuan", "Ung Van Yen", "Tang Thi Yen Nhi", "Doan Khong Lop",
];

const USERS = [
  { id: 1, key: "admin", name: "System Admin", email: "admin@sgroup.com", role: "ADMIN" },
  { id: 2, key: "admin2", name: "Second Admin", email: "admin2@sgroup.com", role: "ADMIN" },
  { id: 3, key: "admin3", name: "Third Admin", email: "admin3@sgroup.com", role: "ADMIN" },

  { id: 4, key: "mentor", name: "Mentor Alpha", email: "mentor@sgroup.com", role: "MEMBER" },
  { id: 5, key: "mentor2", name: "Mentor Beta", email: "mentor2@sgroup.com", role: "MEMBER" },
  { id: 6, key: "mentor3", name: "Mentor Gamma", email: "mentor3@sgroup.com", role: "MEMBER" },
  { id: 7, key: "mentor4", name: "Mentor Delta", email: "mentor4@sgroup.com", role: "MEMBER" },
  { id: 8, key: "mentor5", name: "Mentor Epsilon", email: "mentor5@sgroup.com", role: "MEMBER" },

  { id: 9, key: "member", name: "Hoc Vien SGroup", email: "member@sgroup.com", role: "MEMBER" },
  ...MEMBER_NAMES.map((name, i) => ({
    id: i + 10,
    key: `member${i + 2}`,
    name,
    email: `member${i + 2}@sgroup.com`,
    role: "MEMBER",
  })),
];
// member8 (id 16) và member30 (id 38): KHÔNG thuộc lớp nào

// ---------------------------------------------------------------------------
// CLASSES — id cố định, đủ trạng thái: đang học, sắp mở, đã kết thúc, lớp rỗng
// start / end: số ngày so với hôm chạy seed
// progress: số lesson ĐẦU TIÊN mỗi người đã hoàn thành
// submissions: score có giá trị = đã chấm; không có score = chưa chấm
// ---------------------------------------------------------------------------
const CLASSES = [
  {
    id: 1,
    name: "BE Basic - Batch 01",
    description: "Node.js, Express, PostgreSQL, REST API căn bản",
    start: -15,
    end: 45,
    mentor: "mentor",
    // mentor2 vừa là mentor lớp FE 01, vừa học lớp này
    members: ["member", "member2", "member3", "member4", "mentor2",
      "member9", "member10", "member11", "member12", "member13"],
    lessons: [
      ["HTTP & Client-Server", "Request, response, status code, header."],
      ["Node.js căn bản", "Event loop, module, npm."],
      ["Express Routing", "Router, middleware, error handler."],
      ["PostgreSQL & SQL", "Bảng, khóa, JOIN, index."],
      ["Prisma ORM", "Schema, migration, query, relation."],
      ["Validation với Zod", "Kiểm tra body, params, query."],
      ["Authentication với JWT", "Hash password, ký và verify token."],
      ["Testing API", "node:test, supertest, seed dữ liệu test."],
    ],
    progress: { member: 8, member2: 3, member3: 0, member4: 5, mentor2: 1,
      member9: 8, member10: 6, member11: 2, member12: 4, member13: 0 },
    assignments: [
      {
        title: "HTTP & REST API",
        description: "Thiết kế 5 endpoint REST cho quản lý sách.",
        deadline: -7,
        maximumScore: 10,
        submissions: {
          member: { score: 9, feedback: "Làm tốt, cần bổ sung validation." },
          member2: { score: 7, feedback: "Status code chưa chuẩn ở DELETE." },
          member4: { score: 8, feedback: "Ổn, đặt tên route nhất quán hơn." },
          mentor2: { score: 7, feedback: "Thiếu xử lý 404." },
          member9: { score: 10, feedback: "Xuất sắc." },
          member10: { score: 6, feedback: "Cần đọc lại phần idempotent." },
          member12: {}, // đã nộp, chưa chấm
          // member3, member11, member13: không nộp (quá hạn)
        },
      },
      {
        title: "Express CRUD",
        description: "CRUD todo list bằng Express + PostgreSQL.",
        deadline: -1,
        maximumScore: 10,
        submissions: {
          member: { score: 8, feedback: "Đủ chức năng." },
          member4: {},
          member9: { score: 9, feedback: "Code sạch." },
          member10: {},
          member11: { score: 5, feedback: "Thiếu phần update và delete." },
        },
      },
      {
        title: "Auth với JWT",
        description: "Login, middleware authenticate, phân quyền theo role.",
        deadline: 7,
        maximumScore: 10,
        submissions: { member: {}, member9: {} },
      },
      {
        title: "Final Project",
        description: "Hệ thống quản lý lớp học hoàn chỉnh.",
        deadline: 40,
        maximumScore: 100,
        submissions: {},
      },
    ],
  },
  {
    id: 2,
    name: "FE Basic - Batch 01",
    description: "HTML, CSS, JavaScript, React căn bản",
    start: -3,
    end: 70,
    mentor: "mentor2",
    members: ["member", "member5", "member6", "member14", "member15", "member16"],
    lessons: [
      ["HTML Semantic", "Thẻ ngữ nghĩa, form, accessibility."],
      ["CSS Flexbox & Grid", "Layout hiện đại, responsive."],
      ["JavaScript DOM", "Query, event, render danh sách."],
      ["Fetch API", "Gọi API, async/await, xử lý lỗi."],
      ["React Component", "Props, state, JSX."],
      ["React Hooks", "useState, useEffect, custom hook."],
    ],
    progress: { member: 1, member5: 6, member6: 0, member14: 3, member15: 2, member16: 5 },
    assignments: [
      {
        title: "Responsive Landing Page",
        description: "Làm landing page responsive từ thiết kế Figma.",
        deadline: -2,
        maximumScore: 10,
        submissions: {
          member: { score: 6, feedback: "Mobile bị vỡ layout." },
          member5: { score: 9, feedback: "Layout chuẩn, chú ý contrast màu chữ." },
          member14: { score: 7, feedback: "Thiếu breakpoint tablet." },
          member16: {},
        },
      },
      {
        title: "JavaScript DOM Todo",
        description: "Todo list thuần JavaScript, lưu localStorage.",
        deadline: 10,
        maximumScore: 10,
        submissions: { member5: {} },
      },
    ],
  },
  {
    id: 3,
    name: "DevOps Intro - Batch 01",
    description: "Docker, CI/CD — lớp sắp khai giảng, chưa có lesson",
    start: 27,
    end: 90,
    mentor: "mentor3",
    members: ["member7", "member17", "member18"],
    lessons: [], // BR-18: totalLessons = 0 → progress = 0
    progress: {},
    assignments: [],
  },
  {
    id: 4,
    name: "BE Basic - Batch 00",
    description: "Lớp đã kết thúc",
    start: -95,
    end: -35,
    mentor: "mentor",
    members: ["member6", "member19", "member20", "member21"],
    lessons: [
      ["Tổng quan Backend", "Vai trò backend, API, database."],
      ["REST API", "Resource, method, status code."],
      ["Database", "Thiết kế bảng, quan hệ."],
      ["Final Project", "Hướng dẫn làm đồ án cuối khóa."],
    ],
    progress: { member6: 4, member19: 4, member20: 3, member21: 2 },
    assignments: [
      {
        title: "Final Project",
        description: "Đồ án cuối khóa.",
        deadline: -40,
        maximumScore: 100,
        submissions: {
          member6: { score: 85, feedback: "Đạt yêu cầu." },
          member19: { score: 92, feedback: "Rất tốt, có test đầy đủ." },
          member20: { score: 70, feedback: "Thiếu phân quyền." },
          member21: { score: 55, feedback: "Chưa hoàn thiện." },
        },
      },
    ],
  },
  {
    id: 5,
    name: "Mobile Flutter - Batch 01",
    description: "Dart, Flutter widget, state management",
    start: -10,
    end: 60,
    mentor: "mentor4",
    // mentor3 vừa là mentor DevOps + React, vừa học lớp này
    members: ["member2", "member22", "member23", "member24", "member25", "mentor3"],
    lessons: [
      ["Dart căn bản", "Biến, hàm, class, null safety."],
      ["Widget Tree", "Stateless, Stateful, layout widget."],
      ["Navigation", "Navigator, route, truyền dữ liệu."],
      ["State Management", "Provider, setState."],
      ["Gọi API", "http package, JSON parse."],
    ],
    progress: { member2: 2, member22: 5, member23: 1, member24: 0, member25: 3, mentor3: 2 },
    assignments: [
      {
        title: "Flutter Counter App",
        description: "App đếm số có tăng, giảm, reset.",
        deadline: -3,
        maximumScore: 10,
        submissions: {
          member2: { score: 8, feedback: "Ổn." },
          member22: { score: 10, feedback: "Hoàn hảo." },
          member25: {},
          mentor3: { score: 9, feedback: "Tốt." },
        },
      },
      {
        title: "Flutter Weather App",
        description: "App thời tiết gọi OpenWeather API.",
        deadline: 14,
        maximumScore: 20,
        submissions: { member22: {} },
      },
    ],
  },
  {
    id: 6,
    name: "Data & SQL - Batch 01",
    description: "SQL nâng cao, index, tối ưu truy vấn",
    start: -20,
    end: 40,
    mentor: "mentor5",
    members: ["member3", "member10", "member26", "member27", "member28"],
    lessons: [
      ["SELECT & WHERE", "Lọc, sắp xếp, phân trang."],
      ["JOIN", "INNER, LEFT, RIGHT, FULL."],
      ["GROUP BY", "Hàm tổng hợp, HAVING."],
      ["Subquery & CTE", "WITH, subquery lồng nhau."],
      ["Index", "B-tree, composite index."],
      ["EXPLAIN", "Đọc query plan."],
    ],
    progress: { member3: 6, member10: 1, member26: 4, member27: 0, member28: 2 },
    assignments: [
      {
        title: "SQL JOIN Practice",
        description: "20 câu truy vấn JOIN trên database bán hàng.",
        deadline: -5,
        maximumScore: 10,
        submissions: {
          member3: { score: 10, feedback: "Chính xác toàn bộ." },
          member10: { score: 4, feedback: "Sai nhiều câu LEFT JOIN." },
          member26: { score: 8, feedback: "Tốt." },
          member28: {},
        },
      },
      {
        title: "Index & Query Plan",
        description: "Tối ưu 5 truy vấn chậm bằng index.",
        deadline: 5,
        maximumScore: 10,
        submissions: { member3: {} },
      },
    ],
  },
  {
    id: 7,
    name: "React Advanced - Batch 01",
    description: "React nâng cao — lớp sắp mở, chưa có lesson",
    start: 14,
    end: 80,
    mentor: "mentor3",
    members: ["member14", "member29"],
    lessons: [],
    progress: {},
    assignments: [],
  },
  {
    id: 8,
    name: "UI/UX Design - Batch 01",
    description: "Lớp mới tạo — chưa có member nào",
    start: 30,
    end: 100,
    mentor: "mentor4",
    members: [], // GET /classes/8/members → []
    lessons: [
      ["Design Thinking", "Quy trình 5 bước."],
      ["Figma căn bản", "Frame, component, auto layout."],
    ],
    progress: {},
    assignments: [
      {
        title: "Wireframe App Đặt Lịch",
        description: "Vẽ wireframe 5 màn hình.",
        deadline: 45,
        maximumScore: 10,
        submissions: {},
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// SEED
// ---------------------------------------------------------------------------

const resetDatabase = async () => {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE submissions, assignments, lesson_progress, lessons,
                   class_members, classes, users
    RESTART IDENTITY CASCADE
  `);
};

// Insert id thủ công không làm sequence chạy → đẩy sequence lên MAX(id)
// để POST /users, POST /classes sau đó nhận id tiếp theo (39, 9)
const syncSequence = (table) =>
  prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('${table}', 'id'), (SELECT MAX(id) FROM ${table}))`
  );

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Bài nộp: xoay vòng 3 kiểu (chỉ content / chỉ repo / cả hai) — DB bắt buộc có ít nhất 1
const submissionBody = (index, memberKey, assignmentTitle) => {
  const content = `Bài làm "${assignmentTitle}" của ${memberKey}.`;
  const repo = `https://github.com/${memberKey}/${slug(assignmentTitle)}`;
  if (index % 3 === 0) return { content, repository_url: repo };
  if (index % 3 === 1) return { content, repository_url: null };
  return { content: null, repository_url: repo };
};

const seedUsers = async () => {
  const passwordHash = await hashPassword(PASSWORD);
  await prisma.users.createMany({
    data: USERS.map(({ id, name, email, role }) => ({ id, name, email, role, password_hash: passwordHash })),
  });
  await syncSequence("users");
  return Object.fromEntries(USERS.map((u) => [u.key, u.id]));
};

const seedClass = async (spec, userIds) => {
  const startAt = daysFromNow(spec.start);
  await prisma.classes.create({
    data: {
      id: spec.id,
      name: spec.name,
      description: spec.description,
      start_date: dateOnly(spec.start),
      end_date: dateOnly(spec.end),
      mentor_id: userIds[spec.mentor],
    },
  });

  // joined_at tăng dần theo thứ tự trong mảng → GET members trả đúng thứ tự này
  const joinBase = notAfterNow(new Date(startAt.getTime() - 3 * DAY)).getTime();
  for (const [i, memberKey] of spec.members.entries()) {
    await prisma.class_members.create({
      data: { class_id: spec.id, member_id: userIds[memberKey], joined_at: new Date(joinBase + i * HOUR) },
    });
  }

  const lessonIds = [];
  for (const [i, [title, content]] of spec.lessons.entries()) {
    const lesson = await prisma.lessons.create({
      data: { class_id: spec.id, title, content, order_no: i + 1, created_by: userIds[spec.mentor] },
    });
    lessonIds.push(lesson.id);
  }

  let progressCount = 0;
  for (const [memberKey, done] of Object.entries(spec.progress)) {
    for (const [i, lessonId] of lessonIds.slice(0, done).entries()) {
      await prisma.lesson_progress.create({
        data: {
          lesson_id: lessonId,
          member_id: userIds[memberKey],
          completed_at: notAfterNow(new Date(startAt.getTime() + (i + 1) * DAY)),
        },
      });
      progressCount++;
    }
  }

  const assignmentIds = [];
  let submissionCount = 0;
  for (const a of spec.assignments) {
    const deadline = daysFromNow(a.deadline);
    const assignment = await prisma.assignments.create({
      data: {
        class_id: spec.id,
        title: a.title,
        description: a.description,
        deadline,
        maximum_score: a.maximumScore,
      },
    });
    assignmentIds.push(assignment.id);

    // Nộp trước deadline (BR-23) và không ở tương lai
    const submitBase = Math.min(deadline.getTime(), NOW) - 2 * DAY;
    for (const [i, [memberKey, review]] of Object.entries(a.submissions).entries()) {
      const submittedAt = new Date(submitBase + i * HOUR);
      const reviewed = review.score !== undefined;
      await prisma.submissions.create({
        data: {
          assignment_id: assignment.id,
          member_id: userIds[memberKey],
          ...submissionBody(submissionCount, memberKey, a.title),
          submitted_at: submittedAt,
          score: reviewed ? review.score : null,
          feedback: reviewed ? review.feedback : null,
          reviewed_at: reviewed ? notAfterNow(new Date(submittedAt.getTime() + DAY)) : null,
        },
      });
      submissionCount++;
    }
  }

  return { lessonIds, assignmentIds, progressCount, submissionCount };
};

const range = (ids) => (ids.length ? `${ids[0]}–${ids[ids.length - 1]}` : "—");

const main = async () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed sẽ XÓA toàn bộ dữ liệu — không chạy trên production");
  }

  await resetDatabase();
  const userIds = await seedUsers();

  const summary = [];
  for (const spec of CLASSES) {
    const r = await seedClass(spec, userIds);
    summary.push({
      id: spec.id,
      class: spec.name,
      mentor: `${spec.mentor} (id ${userIds[spec.mentor]})`,
      members: spec.members.length,
      lessonIds: range(r.lessonIds),
      assignmentIds: range(r.assignmentIds),
      progress: r.progressCount,
      submissions: r.submissionCount,
    });
  }
  await syncSequence("classes");

  console.log(`\nSeed xong ${USERS.length} user — mật khẩu chung: ${PASSWORD}`);
  console.table(USERS.map(({ id, email, role }) => ({ id, email, role })));
  console.table(summary);
};

main()
  .catch((err) => {
    console.error("Lỗi khi seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
