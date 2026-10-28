Create type user_role as Enum('ADMIN', 'MEMBER');

Create Table users(
    id Serial Primary key,
    name varchar(100) not null,
    email varchar(255) not null unique,
    password_hash varchar(255) not null,
    role user_role Not null default 'MEMBER',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


Create Table classes(
    id Serial Primary key,
    name varchar(150) not null,
    description text,
    start_date date not null,
    end_date date not null,
    mentor_id int not null references users(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint chk_class_dates check (end_date > start_date)
);
Create index idx_classes_mentor_id on classes(mentor_id);

Create Table class_members(
    id Serial Primary key,
    class_id int not null references classes(id) on delete cascade,
    member_id int not null references users(id) on delete cascade,
    joined_at timestamptz not null default now(),
    constraint uq_class_member unique (class_id, member_id)
);
Create index idx_class_members_member_id on class_members(member_id);

Create Table lessons(
    id Serial Primary key,
    class_id int not null references classes(id) on delete cascade,
    title varchar(200) not null,
    content text not null,
    order_no int not null,
    created_by int not null references users(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uq_lesson_order unique(class_id, order_no)
);

Create Table lesson_progress( 
    id Serial Primary key,
    lesson_id int not null references lessons(id) on delete cascade,
    member_id int not null references users(id) on delete cascade,
    completed_at timestamptz not null default now(),
    constraint uq_lesson_member unique (lesson_id, member_id)
);
Create index idx_lesson_progress_member_id On lesson_progress(member_id);

Create Table assignments(
    id Serial Primary key,
    class_id int not null references classes(id) on delete cascade,
    title varchar(200) not null,
    description text,
    deadline timestamptz not null,
    /*maximum_score int not null check(maximum_score>0),*/
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
Create index idx_assignments_class_id on assignments(class_id);

Create Table submissions(
    id Serial Primary key,
    assignment_id int not null references assignments(id) on delete cascade,
    member_id int not null references users(id) on delete cascade,
    content text,
    repository_url varchar(500),
    submitted_at timestamptz not null default now(),
    feedback text,
    reviewed_at timestamptz,
    constraint uq_submission unique (assignment_id, member_id),
    constraint chk_submission_body check(content is not null or repository_url is not null)
);
Create index idx_submissions_member_id on submissions(member_id);

INSERT INTO users (name, email, password_hash) VALUES ('A', 'a@a.com', 'x');
INSERT INTO users (name, email, password_hash) VALUES ('B', 'a@a.com', 'x');