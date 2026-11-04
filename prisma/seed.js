import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/passwordHelper.js";

const prisma = new PrismaClient();

const PASSWORD = "Password123!";

// Ngày tính theo thời điểm chạy seed, để deadline "đã qua / sắp tới" luôn đúng
const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const dateOnly = (days) => new Date(daysFromNow(days).toISOString().slice(0, 10));

// ---------------------------------------------------------------------------
// DỮ LIỆU
// ---------------------------------------------------------------------------

const USERS = [
  { key: "admin", name: "System Admin", email: "admin@sgroup.com", role: "ADMIN" },
  { key: "admin2", name: "Second Admin", email: "admin2@sgroup.com", role: "ADMIN" },

  // Mentor không phải role: tất cả đều là MEMBER, chỉ khác ở classes.mentor_id
  { key: "mentorAlpha", name: "Mentor Alpha", email: "mentor@sgroup.com", role: "MEMBER" },
  { key: "mentorBeta", name: "Mentor Beta", email: "mentor2@sgroup.com", role: "MEMBER" },
  { key: "mentorGamma", name: "Mentor Gamma", email: "mentor3@sgroup.com", role: "MEMBER" },

  { key: "member", name: "Hoc Vien SGroup", email: "member@sgroup.com", role: "MEMBER" },
  { key: "member2", name: "Nguyen Van An", email: "member2@sgroup.com", role: "MEMBER" },
  { key: "member3", name: "Tran Thi Binh", email: "member3@sgroup.com", role: "MEMBER" },
  { key: "member4", name: "Le Hoang Cuong", email: "member4@sgroup.com", role: "MEMBER" },
  { key: "member5", name: "Pham Minh Duc", email: "member5@sgroup.com", role: "MEMBER" },
  { key: "member6", name: "Vo Thanh Em", email: "member6@sgroup.com", role: "MEMBER" },
  { key: "member7", name: "Dang Gia Huy", email: "member7@sgroup.com", role: "MEMBER" },
  { key: "memberFree", name: "Bui Khong Lop", email: "member8@sgroup.com", role: "MEMBER" },
];

const CLASSES = [
  {
    key: "be01",
    name: "BE Basic - Batch 01",
    description: "Node.js, Express, PostgreSQL, REST API căn bản",
    start: -15,
    end: 45,
    mentor: "mentorAlpha",
    // mentorBeta vừa là mentor lớp FE, vừa học lớp này
    members: ["member", "member2", "member3", "member4", "mentorBeta"],
    lessons: [
      { title: "HTTP & Client-Server", content: "Request, response, status code, header." },
      { title: "Node.js căn bản", content: "Event loop, module, npm." },
      { title: "Express Routing", content: "Router, middleware, error handler." },
      { title: "PostgreSQL & SQL", content: "Bảng, khóa, JOIN, index." },
      { title: "Authentication với JWT", content: "Hash password, ký và verify token." },
    ],
    // Số lesson đầu tiên mỗi người đã hoàn thành → progress
    progress: { member: 5, member2: 2, member3: 0, member4: 3, mentorBeta: 1 },
    assignments: [
      {
        title: "HTTP & REST API",
        description: "Thiết kế 5 endpoint REST cho quản lý sách.",
        deadline: -3, // đã quá hạn
        submissions: {
          member: {
            content: "Em đã thiết kế đủ 5 endpoint, kèm status code.",
            repositoryUrl: "https://github.com/member/rest-books",
            feedback: "Làm tốt, cần bổ sung validation.",
          },
          member2: { content: "Bài làm của em ở file đính kèm." }, // chưa chấm
          // member3, member4: không nộp → test nộp sau deadline (BR-23)
        },
      },
      {
        title: "Express CRUD",
        description: "CRUD todo list bằng Express + PostgreSQL.",
        deadline: 7,
        submissions: {
          member4: { repositoryUrl: "https://github.com/member4/express-todo" },
        },
      },
      {
        title: "Auth với JWT",
        description: "Login, middleware authenticate, phân quyền theo role.",
        deadline: 21,
        submissions: {},
      },
    ],
  },
  {
    key: "fe01",
    name: "FE Basic - Batch 01",
    description: "HTML, CSS, JavaScript, React căn bản",
    start: -3,
    end: 70,
    mentor: "mentorBeta",
    members: ["member", "member5", "member6"],
    lessons: [
      { title: "HTML Semantic", content: "Thẻ ngữ nghĩa, form, accessibility." },
      { title: "CSS Flexbox & Grid", content: "Layout hiện đại, responsive." },
      { title: "JavaScript DOM", content: "Query, event, render danh sách." },
    ],
    progress: { member: 1, member5: 3, member6: 0 },
    assignments: [
      {
        title: "Responsive Landing Page",
        description: "Làm landing page responsive từ thiết kế Figma.",
        deadline: 10,
        submissions: {
          member5: {
            repositoryUrl: "https://github.com/member5/landing",
            feedback: "Layout chuẩn, chú ý contrast màu chữ.",
          },
        },
      },
    ],
  },
  {
    key: "devops01",
    name: "DevOps Intro - Batch 01",
    description: "Docker, CI/CD — lớp chưa khai giảng, chưa có lesson",
    start: 27,
    end: 90,
    mentor: "mentorGamma",
    members: ["member7"],
    lessons: [], // progress phải = 0 (BR-18: totalLessons = 0)
    progress: {},
    assignments: [],
  },
  {
    key: "be00",
    name: "BE Basic - Batch 00",
    description: "Lớp đã kết thúc",
    start: -95,
    end: -35,
    mentor: "mentorAlpha",
    members: ["member6"],
    lessons: [
      { title: "Tổng quan Backend", content: "Vai trò backend, API, database." },
      { title: "Final Project", content: "Hướng dẫn làm đồ án cuối khóa." },
    ],
    progress: { member6: 2 },
    assignments: [
      {
        title: "Final Project",
        description: "Đồ án cuối khóa.",
        deadline: -40,
        submissions: {
          member6: {
            content: "Đồ án quản lý thư viện.",
            repositoryUrl: "https://github.com/member6/library",
            feedback: "Đạt yêu cầu.",
          },
        },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// SEED — chạy lại nhiều lần được: upsert theo các khóa unique, không tạo trùng
// ---------------------------------------------------------------------------

const seedUsers = async () => {
  const passwordHash = await hashPassword(PASSWORD);
  const users = {};
  for (const { key, name, email, role } of USERS) {
    // update cũng reset tên/role/password về trạng thái seed (hữu ích sau khi test sửa user)
    users[key] = await prisma.users.upsert({
      where: { email },
      update: { name, role, password_hash: passwordHash, updated_at: new Date() },
      create: { name, email, role, password_hash: passwordHash },
    });
  }
  return users;
};

const upsertClass = async (data) => {
  const existing = await prisma.classes.findFirst({ where: { name: data.name } });
  if (existing) {
    return prisma.classes.update({ where: { id: existing.id }, data: { ...data, updated_at: new Date() } });
  }
  return prisma.classes.create({ data });
};

const upsertAssignment = async (data) => {
  const existing = await prisma.assignments.findFirst({
    where: { class_id: data.class_id, title: data.title },
  });
  if (existing) {
    return prisma.assignments.update({ where: { id: existing.id }, data: { ...data, updated_at: new Date() } });
  }
  return prisma.assignments.create({ data });
};

const seedClass = async (spec, users) => {
  const cls = await upsertClass({
    name: spec.name,
    description: spec.description,
    start_date: dateOnly(spec.start),
    end_date: dateOnly(spec.end),
    mentor_id: users[spec.mentor].id,
  });

  for (const memberKey of spec.members) {
    await prisma.class_members.upsert({
      where: { class_id_member_id: { class_id: cls.id, member_id: users[memberKey].id } },
      update: {},
      create: { class_id: cls.id, member_id: users[memberKey].id },
    });
  }

  const lessons = [];
  for (const [index, lesson] of spec.lessons.entries()) {
    const order = index + 1;
    lessons.push(
      await prisma.lessons.upsert({
        where: { class_id_order_no: { class_id: cls.id, order_no: order } },
        update: { title: lesson.title, content: lesson.content },
        create: {
          class_id: cls.id,
          title: lesson.title,
          content: lesson.content,
          order_no: order,
          created_by: users[spec.mentor].id,
        },
      })
    );
  }

  for (const [memberKey, completedCount] of Object.entries(spec.progress)) {
    for (const lesson of lessons.slice(0, completedCount)) {
      await prisma.lesson_progress.upsert({
        where: { lesson_id_member_id: { lesson_id: lesson.id, member_id: users[memberKey].id } },
        update: {},
        create: { lesson_id: lesson.id, member_id: users[memberKey].id },
      });
    }
  }

  let submissionCount = 0;
  for (const assignmentSpec of spec.assignments) {
    const assignment = await upsertAssignment({
      class_id: cls.id,
      title: assignmentSpec.title,
      description: assignmentSpec.description,
      deadline: daysFromNow(assignmentSpec.deadline),
    });

    for (const [memberKey, sub] of Object.entries(assignmentSpec.submissions)) {
      const data = {
        content: sub.content ?? null,
        repository_url: sub.repositoryUrl ?? null,
        feedback: sub.feedback ?? null,
        reviewed_at: sub.feedback ? daysFromNow(-1) : null,
      };
      await prisma.submissions.upsert({
        where: { assignment_id_member_id: { assignment_id: assignment.id, member_id: users[memberKey].id } },
        update: data,
        create: { assignment_id: assignment.id, member_id: users[memberKey].id, ...data },
      });
      submissionCount++;
    }
  }

  return { cls, lessons: lessons.length, assignments: spec.assignments.length, submissionCount };
};

const main = async () => {
  const users = await seedUsers();

  const summary = [];
  for (const spec of CLASSES) {
    const result = await seedClass(spec, users);
    summary.push({
      id: result.cls.id,
      class: spec.name,
      mentor: users[spec.mentor].email,
      members: spec.members.length,
      lessons: result.lessons,
      assignments: result.assignments,
      submissions: result.submissionCount,
    });
  }

  console.log(`\nSeed xong ${USERS.length} user (mật khẩu chung: ${PASSWORD})`);
  console.table(USERS.map(({ email, role }) => ({ email, role })));
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
