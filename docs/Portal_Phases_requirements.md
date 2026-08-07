# University Portal with AI Academic Assistant
## Team-Based Phased Requirements & Build Plan

**Team Members:** Sian, Tayabba, Hammad  
**Project:** University Portal with AI Academic Assistant  
**Institution:** NCBA&E  
**Project Type:** Final Year Project

---

# 1. Purpose of This Plan

This document divides the complete FYP into ordered development phases and assigns clear ownership to each team member.

The aim is to ensure that:

- Everyone knows exactly what they are responsible for.
- Features are developed in the correct dependency order.
- Team members can work in parallel where possible.
- No member builds features that depend on unfinished data from another member.
- Each member owns meaningful parts of the final project.
- Features can be tested phase by phase.
- The final project can be integrated gradually instead of at the end.

The division is:

### Sian — Core Academic Management

Sian will mainly own:

- Authentication flows
- User management
- Academic structure
- Students
- Teachers
- HODs
- Departments
- Programs
- Batches
- Semesters
- Sections
- Courses
- Course assignments
- Enrollment
- Semester promotion
- Search and filtering

### Tayabba — Academic Performance Management

Tayabba will mainly own:

- Attendance
- Attendance percentages
- Attendance shortages
- Assessment structure
- Quizzes
- Assignments
- Marks
- Grades
- GPA
- CGPA
- Result submission
- HOD approval
- Result cards

### Hammad — Student Services & AI

Hammad will mainly own:

- Fee information
- Timetable
- Examination date sheet
- Course materials
- Announcements
- Notifications
- Student dashboard
- AI knowledge base
- Gemini chatbot
- AI student queries

---

# PHASE 1 — Basic Project User Flow

## Objective

Create the basic portal experience where users can log in and see different areas according to their role.

This phase should be completed before building actual university modules.

---

## Sian — Phase 1 Responsibilities

### 1. User Roles

The system must recognize four roles:

- Student
- Teacher
- HOD
- Admin

Each user will have one fixed role.

Users must only be able to access features belonging to their role.

### 2. Login

Create a common login flow.

Students can log in using:

- Registration number
- Gmail address

Teachers, HODs, and admins can log in using:

- Employee ID
- Gmail address

### 3. Logout

Users must be able to securely log out.

### 4. Temporary Password

New users should initially receive a temporary password.

### 5. First Login Password Change

If the account has a temporary password:

1. User logs in.
2. User must immediately change the password.
3. Normal portal access is allowed only after changing it.

### 6. Account Status

Every account must have:

- Active
- Inactive

Inactive accounts must not be able to log in.

### 7. Role Navigation

Create basic role-specific navigation.

#### Student

Basic areas:

- Dashboard
- Courses
- Attendance
- Results
- Fees
- Timetable
- Exams
- Materials
- Announcements

#### Teacher

Basic areas:

- Dashboard
- Courses
- Attendance
- Assessments
- Results
- Materials

#### HOD

Basic areas:

- Dashboard
- Department
- Courses
- Teachers
- Attendance
- Results

#### Admin

Basic areas:

- Dashboard
- Students
- Teachers
- Departments
- Programs
- Academic Structure
- Courses
- Fees
- Timetables
- Exams
- Announcements

---

## Tayabba — Phase 1 Responsibilities

Tayabba does not need complete academic features yet.

Prepare basic placeholder pages for:

- Attendance
- Assessments
- Marks
- Results

Each page should already respect the user's role.

For example:

Teacher should see:

> No assigned courses available yet.

Student should see:

> No attendance records available yet.

HOD should see:

> No results awaiting approval.

---

## Hammad — Phase 1 Responsibilities

Prepare basic placeholder student-service pages:

- Fees
- Timetable
- Exams
- Course materials
- Announcements

Also prepare:

- Empty notification area
- Basic student dashboard layout
- Placeholder chatbot button

The chatbot does not need to work yet.

---

## Phase 1 Completion Criteria

Phase 1 is complete when:

- All four roles can log in.
- Each role sees different navigation.
- Unauthorized sections cannot be opened.
- Temporary password change works.
- Inactive account login is blocked.
- Users can log out.
- All future major pages have basic placeholders.

---

# PHASE 2 — Academic Structure

## Objective

Create the university hierarchy that every later feature depends on.

---

# Sian — Phase 2 Responsibilities

Sian owns this complete phase.

## 1. Department Management

Admin can create departments.

Department fields:

- Department name
- Department code
- Description
- Active status

Admin should be able to:

- Add department
- View departments
- Edit department
- Delete department

Example:

> Computer Science

---

## 2. Program Management

Programs belong to departments.

Program information:

- Program name
- Program code
- Department
- Total semesters
- Duration
- Active status

Example:

> Department: Computer Science  
> Program: BS Computer Science

Admin should be able to:

- Add program
- View programs
- Edit program
- Delete program

---

## 3. Batch Management

Students belong to batches.

Example:

- Fall 2023
- Spring 2024

Batch information:

- Batch name
- Program
- Starting year
- Expected graduation year
- Active status

Admin can:

- Add batch
- Edit batch
- Delete batch
- View batches

---

## 4. Semester Management

The portal will support one active semester at a time.

Admin can:

- Create semesters
- View semesters
- Activate semester
- Close semester

Previous semester academic records must remain available.

---

## 5. Section Management

Admin can create sections.

Section belongs to:

- Program
- Batch
- Semester

Fields:

- Section name
- Program
- Batch
- Semester
- Active status

Example:

> BSCS → Batch 2023 → Semester 8 → Section A

---

## Final Academic Hierarchy

The portal should follow:

> Department → Program → Batch → Semester → Section

---

# Tayabba — Phase 2 Responsibilities

Review the academic structure from the perspective of future attendance and results.

Ensure Tayabba can identify:

- Which section a student belongs to.
- Which semester is active.
- Which program the section belongs to.

No complete feature development is required yet.

---

# Hammad — Phase 2 Responsibilities

Review how the academic structure will affect:

- Timetables
- Exams
- Materials
- AI queries

Hammad should ensure later features can identify:

> Program + Semester + Section

---

## Phase 2 Completion Criteria

Admin must be able to create an example academic structure such as:

> Computer Science  
> BSCS  
> Fall 2023  
> Semester 8  
> Section A

without needing any manual database changes.

---

# PHASE 3 — Student, Teacher and HOD Management

## Objective

Populate the portal with actual university users.

---

# Sian — Phase 3 Responsibilities

## 1. Student Creation

Admin can manually create students.

Student information:

- Full name
- Registration number
- Gmail
- Phone number
- Department
- Program
- Batch
- Semester
- Section
- Academic status
- Account status
- Profile picture if needed

### Academic Statuses

- Active
- Frozen
- Repeating
- Dropped
- Graduated

---

## 2. Student Profile

Student can view:

- Name
- Registration number
- Gmail
- Program
- Batch
- Semester
- Section
- Status

Student cannot edit their profile.

Admin can edit student information.

---

## 3. Bulk Student Import

Admin can upload CSV or Excel containing students.

The system should:

- Import valid rows.
- Skip invalid rows.
- Show successful count.
- Show failed count.
- Show row number of errors.
- Show reason for failure.

Possible failures:

- Duplicate registration number
- Duplicate Gmail
- Missing name
- Invalid program
- Invalid section
- Invalid semester
- Missing required information

Valid students should still be imported even when other rows fail.

---

## 4. Duplicate Prevention

The system must prevent duplicate:

- Registration numbers
- Employee IDs
- Gmail addresses

---

## 5. Teacher Management

Admin can create teachers.

Teacher information:

- Full name
- Employee ID
- Gmail
- Phone
- Department
- Designation
- Account status
- Profile picture if required

Teacher can view the profile but cannot edit it.

---

## 6. HOD Management

Admin can create or assign an HOD.

The HOD should belong to a department.

Each department can have its assigned HOD.

---

## 7. Admin Password Reset

Admin can reset a user's password.

The new password becomes temporary.

The user must change it after login.

---

# Tayabba — Phase 3 Responsibilities

Prepare academic-performance pages to work with real students.

For example:

Teacher attendance page should later be able to display:

- Registration number
- Student name

Result pages should later be able to identify:

- Student
- Program
- Semester
- Section

---

# Hammad — Phase 3 Responsibilities

Prepare student services to use actual logged-in student information.

For example:

- Student fee page identifies current student.
- Student timetable identifies program/semester/section.
- Chatbot identifies the currently logged-in student.

---

## Phase 3 Completion Criteria

The portal should contain:

- Admin
- HOD
- Teachers
- Students

Each should be able to log in and see their own information.

---

# PHASE 4 — Courses, Teacher Assignment and Student Enrollment

## Objective

Connect courses, students, teachers, sections, and semesters.

---

# Sian — Phase 4 Responsibilities

## 1. Course Management

Admin can create courses.

Course information:

- Course code
- Course title
- Credit hours
- Department
- Program
- Semester
- Description
- Active status

---

## 2. Course Assignment

Admin assigns courses to:

> Program → Semester → Section

Example:

> BSCS → Semester 8 → Section A → Computer Networks

---

## 3. Automatic Student Enrollment

Students must not select courses.

When courses are assigned to a section:

- All active students in that section automatically receive those courses.

If a new student joins that section later:

- The student automatically receives currently assigned courses.

---

## 4. Teacher Assignment

Each course section must have one teacher.

Admin or HOD can assign the teacher.

Example:

> Computer Networks  
> BSCS Semester 8 Section A  
> Teacher: Mr. XYZ

---

## 5. Student Course View

Student sees:

- Course code
- Course name
- Credit hours
- Teacher

---

## 6. Teacher Course View

Teacher sees:

- Assigned courses
- Sections
- Number of enrolled students

---

## 7. HOD Course View

HOD can see:

- Department courses
- Assigned teachers
- Sections

---

# Tayabba — Phase 4 Responsibilities

Connect academic modules to the course assignments.

Attendance must know:

> Which students belong to this teacher's course?

Results must know:

> Which students belong to this course section?

Teachers must not be able to enter attendance or marks for unassigned courses.

---

# Hammad — Phase 4 Responsibilities

Connect student services to enrolled courses.

Course materials will later use these course enrollments.

AI will later use:

- Student courses
- Assigned teachers

---

## Phase 4 Completion Criteria

A logged-in student must see their assigned courses.

A teacher must see only their assigned course sections.

---

# PHASE 5 — Attendance Management

## Objective

Complete the first major teacher-to-student academic workflow.

---

# Tayabba — Phase 5 Owner

Tayabba owns this phase.

## 1. Attendance Creation

Teacher selects:

- Assigned course
- Date

Then sees all enrolled students.

---

## 2. Attendance Statuses

For each student:

- Present
- Absent
- Leave

---

## 3. One Attendance Session Per Date

Only one attendance session may exist for the same:

> Course section + date

Duplicate attendance sessions should not be created.

---

## 4. Attendance Editing

Teacher can edit previous attendance during the active semester.

---

## 5. Attendance History

Teacher can view previous attendance dates.

Selecting a date should show student statuses.

---

## 6. Attendance Percentage

Calculate:

> Present Classes / Total Conducted Classes × 100

Absent and Leave both reduce attendance percentage.

---

## 7. Attendance Requirement

Admin should be able to set the minimum attendance requirement.

Example:

> 75%

---

## 8. Student Attendance Page

For each course student sees:

- Total classes
- Present
- Absent
- Leave
- Attendance percentage
- Required attendance

---

## 9. Attendance Shortage

If attendance falls below the configured percentage:

- Show warning
- Mark affected course
- Show current percentage
- Show required percentage

---

## 10. HOD Attendance View

HOD can see:

- Department attendance summary
- Students below attendance threshold
- Course
- Student
- Current percentage

---

# Sian — Phase 5 Responsibilities

Provide Tayabba access to:

- Student enrollments
- Course sections
- Assigned teachers
- Active semester

Admin should also be able to configure the attendance threshold.

---

# Hammad — Phase 5 Responsibilities

Prepare student dashboard attendance cards.

Examples:

- Overall attendance summary
- Courses below threshold
- Recent attendance update

No AI integration yet.

---

## Phase 5 Completion Criteria

Complete workflow:

> Teacher marks attendance → percentage calculates → student sees attendance → shortage warning appears → HOD can monitor low attendance.

---

# PHASE 6 — Assessments and Marks

## Objective

Allow teachers to enter complete semester assessment information.

---

# Tayabba — Phase 6 Owner

## 1. Standard Assessment Structure

Admin defines common categories.

Example:

- Assignments
- Quizzes
- Midterm
- Final

Each has a percentage.

Total must equal:

> 100%

---

## 2. Multiple Quizzes

Teacher can create:

- Quiz 1
- Quiz 2
- Quiz 3

Each can have its own maximum marks.

---

## 3. Multiple Assignments

Teacher can create:

- Assignment 1
- Assignment 2
- Assignment 3

Each can have its own maximum marks.

---

## 4. Midterm

Teacher enters midterm marks.

---

## 5. Final Examination

Teacher enters final marks.

---

## 6. Spreadsheet-Style Marks Entry

Teacher sees all students together.

Example:

| Student | Registration | Marks |
|---|---|---|
| Student A | BSCS-001 | 8 |
| Student B | BSCS-002 | 7 |

---

## 7. Marks Validation

Marks cannot exceed maximum marks.

---

## 8. Special Statuses

Instead of numeric marks, teacher can select:

- Absent
- Exempted
- Result Withheld

---

## 9. Draft Marks

Teacher can save incomplete marks without submitting results.

---

## 10. Assessment Calculation

The system combines multiple assessments inside each category.

Example:

Quiz category = 10%

Quiz 1 and Quiz 2 should combine into that 10%.

---

# Sian — Phase 6 Responsibilities

Admin must have access to configure:

- Assessment categories
- Weightages

---

# Hammad — Phase 6 Responsibilities

Prepare student dashboard area for:

- Recent marks
- Academic performance summary

Students must not see marks that have not yet been officially published.

---

## Phase 6 Completion Criteria

Teacher can completely enter marks for one course and save them as draft.

---

# PHASE 7 — Results, Grades, GPA and HOD Approval

## Objective

Turn assessment marks into official student results.

---

# Tayabba — Phase 7 Owner

## 1. Grading Scale

Admin defines:

- Percentage range
- Letter grade
- Grade point

Example:

| Percentage | Grade | Point |
|---|---|---|
| 85–100 | A | 4.0 |
| 80–84 | A- | 3.7 |

---

## 2. Automatic Result Calculation

System calculates:

- Weighted total
- Percentage
- Letter grade
- Grade point

---

## 3. GPA Calculation

Calculate semester GPA using:

- Course grade points
- Credit hours

---

## 4. CGPA

Calculate cumulative GPA using completed results.

---

## 5. Teacher Result Submission

Teacher can:

- Review complete course result
- Submit result

After submission:

> Pending HOD Approval

---

## 6. HOD Review

HOD sees:

- Course
- Teacher
- Students
- Marks
- Grades
- Result summary

---

## 7. HOD Approval

HOD can:

- Approve complete course result
- Return complete result with comments

HOD does not approve students individually.

---

## 8. Returned Result

Teacher sees HOD comment.

Teacher corrects marks.

Teacher resubmits.

---

## 9. Approved Result

After approval:

- Students can see result.
- Teacher cannot normally edit it.
- Result becomes locked.

---

## 10. Result Reopening

HOD and Admin can reopen approved result.

They must provide a reason.

---

# Sian — Phase 7 Responsibilities

Ensure:

- Admin can configure grading scale.
- HOD permissions work correctly.
- Course and student relationships remain valid.

---

# Hammad — Phase 7 Responsibilities

Prepare:

- Student results summary on dashboard.
- Result published notification.

---

## Phase 7 Completion Criteria

Full flow must work:

> Teacher enters marks → submits → HOD returns/approves → student sees approved result.

---

# PHASE 8 — Student Result Card

## Objective

Provide downloadable semester result output.

---

# Tayabba — Phase 8 Owner

Student result card should contain:

- Student name
- Registration number
- Program
- Semester
- Course codes
- Course titles
- Credit hours
- Marks
- Grades
- Grade points
- Semester GPA

Student can:

- View result card
- Download result card

Only approved results should appear.

No official transcript is required.

---

# Sian — Phase 8 Responsibilities

Ensure student identity and academic information appear correctly.

---

# Hammad — Phase 8 Responsibilities

Ensure result card is accessible from:

- Student dashboard
- Results area

---

## Phase 8 Completion Criteria

Student can download a complete semester result card.

---

# PHASE 9 — Fee Information

## Objective

Allow students to check fee information.

---

# Hammad — Phase 9 Owner

## Admin Fee Entry

Admin manually enters for each student:

- Total semester fee
- Paid amount
- Remaining amount
- Due date
- Payment date
- Notes

---

## Fee Status

Possible status:

- Paid
- Partially Paid
- Unpaid
- Overdue

---

## Student Fee Page

Student sees:

- Total fee
- Paid amount
- Remaining amount
- Due date
- Status
- Payment information

Students cannot:

- Make payment
- Edit fee
- Upload payment proof

---

# Sian — Phase 9 Responsibilities

Provide student records needed for fee assignment.

---

# Tayabba — Phase 9 Responsibilities

No major work required.

Assist with testing fee status display where needed.

---

## Phase 9 Completion Criteria

Admin updates fee → student logs in → sees correct fee information.

---

# PHASE 10 — Timetable and Exam Date Sheet

## Objective

Provide simple scheduling information without building scheduling logic.

---

# Hammad — Phase 10 Owner

## Timetable

Admin uploads timetable image.

Assign timetable to:

- Program
- Semester
- Section

Student sees only timetable for their class.

Teacher may see relevant section timetable.

Admin can replace timetable image.

No:

- Timetable builder
- Automatic generation
- Clash detection
- Rescheduling engine

---

## Exam Date Sheet

Admin manually adds:

- Exam type
- Course
- Program
- Semester
- Section
- Date
- Start time
- End time
- Room
- Instructions

Student sees exams belonging to their courses.

Teacher sees relevant exams.

---

# Sian — Phase 10 Responsibilities

Provide program, semester, section, course relationships.

---

# Tayabba — Phase 10 Responsibilities

Ensure exam display can later connect properly with course results if required.

---

## Phase 10 Completion Criteria

Student can view:

- Their timetable image
- Their examination dates

---

# PHASE 11 — Course Materials

## Objective

Allow teachers to share academic resources.

---

# Hammad — Phase 11 Owner

Teacher selects assigned course.

Teacher can add:

- Title
- Description
- File
- External link

Supported files:

- PDF
- DOCX
- PPTX
- XLSX
- JPG
- JPEG
- PNG

Student sees simple file list.

Each item shows:

- Title
- Description
- Teacher
- Upload date
- Download/view option

Only enrolled students can access course materials.

Teacher only manages materials for assigned courses.

No:

- Assignment submission
- Online quizzes
- Discussion boards
- Full LMS

---

# Sian — Phase 11 Responsibilities

Provide:

- Course enrollment information
- Teacher course assignments

---

# Tayabba — Phase 11 Responsibilities

No major development required.

Assist with permission testing.

---

## Phase 11 Completion Criteria

Teacher uploads a file → enrolled student sees and downloads it.

---

# PHASE 12 — Announcements and Notifications

## Objective

Add internal university communication.

---

# Hammad — Phase 12 Owner

## Global Announcements

Admin can create announcement.

Fields:

- Title
- Description
- Publish date
- Expiry date
- Attachment if needed
- Pinned status
- Active status

Announcements are global.

All active portal users see them.

No targeted department announcements.

---

## Notifications

Users receive notifications for events such as:

- Result published
- Result returned
- New material
- Attendance update
- Timetable update
- New announcement
- Result approval

Users can:

- View notification
- See unread count
- Mark as read
- Mark all as read

---

# Sian — Phase 12 Responsibilities

Generate notifications from relevant account/course events where needed.

---

# Tayabba — Phase 12 Responsibilities

Trigger academic notifications such as:

- Result returned
- Result approved
- Result published
- Attendance updated

---

## Phase 12 Completion Criteria

Users receive and manage in-app notifications.

---

# PHASE 13 — Role Dashboards

## Objective

Turn the portal into a useful day-to-day experience.

---

# Hammad — Student Dashboard Owner

Student dashboard should show:

- Student basic information
- Current semester
- Courses
- Attendance percentages
- Attendance shortage warnings
- Recent marks
- GPA
- Fee outstanding
- Recent materials
- Announcements
- Notifications
- AI chatbot button

---

# Tayabba — Teacher and HOD Dashboard Owner

## Teacher Dashboard

Show:

- Assigned courses
- Sections
- Student counts
- Attendance activity
- Marks progress
- Draft results
- Pending result submissions
- Returned results

## HOD Dashboard

Show:

- Department students
- Teachers
- Courses
- Low-attendance students
- Pending result approvals
- Recently approved results
- Academic summary

---

# Sian — Admin Dashboard Owner

Show:

- Total students
- Total teachers
- Departments
- Programs
- Current semester
- Sections
- Courses
- Recent student imports
- Recent academic activity

---

## Phase 13 Completion Criteria

Each role sees useful information immediately after login.

---

# PHASE 14 — Semester Promotion

## Objective

Allow the portal to continue into the next semester.

---

# Sian — Phase 14 Owner

Admin selects:

- Program
- Batch
- Section

System shows students.

Admin may exclude specific students.

Remaining students are promoted to next semester.

Exceptional students are handled manually.

Examples:

- Frozen
- Repeating
- Dropped

Previous semester data must remain available.

No complex transfer handling.

---

# Tayabba — Phase 14 Responsibilities

Ensure previous:

- Attendance
- Results
- GPA records

remain available.

---

# Hammad — Phase 14 Responsibilities

Ensure:

- Old timetable
- Exams
- Materials

do not incorrectly appear as current information.

---

## Phase 14 Completion Criteria

Students can move to next semester while previous academic records remain intact.

---

# PHASE 15 — Audit Log

## Objective

Record important academic and administrative changes.

---

# Sian — Phase 15 Primary Owner

Create central audit-log view.

Track important actions such as:

- Student creation
- Teacher creation
- Bulk student import
- Semester promotion
- Account changes
- Timetable upload
- Fee update

Each record should show:

- User
- Role
- Action
- Module
- Date/time
- Affected record
- Reason where required

---

# Tayabba — Phase 15 Responsibilities

Record:

- Attendance changes
- Result submission
- Result approval
- Result return
- Result reopening
- Grading changes

---

# Hammad — Phase 15 Responsibilities

Record relevant actions such as:

- Fee changes
- Timetable upload
- Announcement actions

---

## Phase 15 Completion Criteria

Admin can inspect important actions from one audit-log area.

---

# PHASE 16 — Search and Filtering

## Objective

Make management easier when the portal has many users.

---

# Sian — Phase 16 Owner

## Student Search

Search by:

- Name
- Registration number
- Gmail

Filter by:

- Department
- Program
- Batch
- Semester
- Section
- Account status

---

## Teacher Search

Search by:

- Name
- Employee ID
- Gmail

Filter by:

- Department
- Designation
- Account status

---

# Tayabba — Phase 16 Responsibilities

Provide useful filters inside:

- Attendance shortage list
- Results
- HOD academic views

---

# Hammad — Phase 16 Responsibilities

Provide simple search where useful for:

- Course materials
- Announcements

Avoid overcomplicating.

---

## Phase 16 Completion Criteria

Admin and HOD can quickly locate students, teachers, and academic records.

---

# PHASE 17 — AI Knowledge Base Preparation

## Objective

Prepare trustworthy university knowledge before building the chatbot.

---

# Hammad — Phase 17 Owner

Hammad will prepare structured knowledge records.

The knowledge is managed by developers, not portal users.

Possible categories:

- Attendance rules
- Passing rules
- Examination rules
- Grading policy
- Academic procedures
- Fee FAQs
- General university FAQs

Each record may contain:

- Title
- Category
- Question
- Answer/information
- Keywords
- Active status
- Last updated date

There is no admin page for managing this knowledge.

The team directly maintains it as developers.

---

# Sian — Phase 17 Responsibilities

Provide information about what student-specific data can be safely retrieved.

Examples:

- Courses
- Teachers
- Student profile identifiers

---

# Tayabba — Phase 17 Responsibilities

Provide correct academic calculations and information for:

- Attendance
- Marks
- GPA
- Results

---

## Phase 17 Completion Criteria

A prepared set of university knowledge records exists and is ready for chatbot use.

---

# PHASE 18 — AI Academic Chatbot

## Objective

Implement the required AI feature.

---

# Hammad — Phase 18 Owner

## Chatbot Access

Available only to students.

Displayed as floating chat button.

---

## Chatbot Capabilities

Student may ask:

- What is my attendance?
- What is my attendance in Computer Networks?
- How many classes did I miss?
- What marks did I get?
- What is my GPA?
- What fee is remaining?
- When is my exam?
- Who teaches Web Engineering?
- What materials are available?
- What is the attendance requirement?
- What is the passing percentage?

---

## Personal Student Information

Chatbot can use:

- Attendance
- Marks
- Grades
- GPA
- CGPA
- Courses
- Teachers
- Fee status
- Timetable
- Exam date sheet
- Announcements
- Course materials

---

## General University Information

Chatbot can use developer-prepared knowledge.

---

## Read-Only Requirement

Chatbot cannot modify anything.

It cannot:

- Change marks
- Mark attendance
- Update fee
- Change profile
- Update results
- Delete anything

---

## Privacy

Chatbot must use the logged-in student.

It must not provide another student's private information.

---

## Follow-Up Questions

The chatbot remembers context during the current session.

Example:

Student:

> What is my attendance in Networks?

Then:

> What about Web Engineering?

The chatbot should understand the follow-up.

---

## No Permanent Chat History

Chat history exists only for the active session.

Logout or session expiry clears it.

---

## Unknown Information

The chatbot must not guess.

If information is unavailable, respond with a clear message asking the student to confirm with university administration.

---

## Hybrid Question Handling

Questions should be handled using:

### Clear personal questions

Retrieve student portal information.

### General university questions

Use university knowledge records.

### Ambiguous or conversational questions

Use Gemini to understand the intent and generate the response.

---

# Sian — Phase 18 Responsibilities

Provide safe access to:

- Authenticated student identity
- Courses
- Teachers
- Student-related academic structure

Ensure AI cannot request arbitrary student records.

---

# Tayabba — Phase 18 Responsibilities

Provide chatbot-readable access to:

- Attendance
- Marks
- GPA
- Grades
- Results

Validate chatbot answers against actual portal values.

---

## Phase 18 Completion Criteria

Students can ask real questions and receive correct personalized responses.

The chatbot must never alter portal data.

---

# PHASE 19 — UI and Responsive Polish

## Objective

Make the complete system feel consistent.

---

# Hammad — Primary UI Coordinator

Review:

- Student pages
- Chatbot
- Navigation
- Mobile layouts
- Tables
- Cards
- Notifications

---

# Sian

Polish:

- Admin pages
- User management
- Academic structure
- Forms
- Search pages

---

# Tayabba

Polish:

- Attendance
- Marks
- Results
- HOD academic pages
- Result card

---

## Shared UI Requirements

All members should follow the same:

- Page layout
- Navigation style
- Button style
- Form style
- Table style
- Empty states
- Loading states
- Error states
- Confirmation dialogs

---

# PHASE 20 — End-to-End Testing

## Objective

Test complete university workflows instead of isolated pages.

---

# Test Scenario 1 — New Student

**Primary: Sian**

1. Admin creates student.
2. Student belongs to program/semester/section.
3. Student receives assigned courses.
4. Student logs in.
5. Student changes temporary password.

---

# Test Scenario 2 — Attendance

**Primary: Tayabba**

1. Teacher logs in.
2. Teacher selects course.
3. Teacher marks attendance.
4. Student logs in.
5. Student sees percentage.
6. Low attendance warning appears if needed.
7. HOD sees shortage.

---

# Test Scenario 3 — Results

**Primary: Tayabba**

1. Teacher creates assessments.
2. Teacher enters marks.
3. Teacher saves draft.
4. Teacher submits.
5. HOD returns result.
6. Teacher fixes result.
7. Teacher resubmits.
8. HOD approves.
9. Student sees published result.
10. Student downloads result card.

---

# Test Scenario 4 — Fee

**Primary: Hammad**

1. Admin updates student fee.
2. Student logs in.
3. Student sees correct remaining amount and status.

---

# Test Scenario 5 — Timetable

**Primary: Hammad**

1. Admin uploads timetable for BSCS Semester 8 Section A.
2. Correct student sees it.
3. Student from another section should not see it.

---

# Test Scenario 6 — Course Material

**Primary: Hammad**

1. Teacher uploads material.
2. Enrolled student sees file.
3. Non-enrolled student cannot access it.

---

# Test Scenario 7 — AI

**Primary: Hammad**

Student asks:

> What is my attendance in Computer Networks?

Correct data should be returned.

Then ask:

> What about Web Engineering?

Follow-up should work.

Then test:

> Tell me another student's marks.

The chatbot must not expose them.

---

# PHASE 21 — Demo Data Preparation

## Objective

Populate the FYP with realistic data before presentation.

---

# Sian

Prepare:

- Departments
- Programs
- Batches
- Semesters
- Sections
- Students
- Teachers
- HOD
- Courses
- Assignments

---

# Tayabba

Prepare:

- Attendance history
- Quiz marks
- Assignment marks
- Midterm marks
- Final marks
- Pending result
- Returned result
- Approved result
- GPA examples

---

# Hammad

Prepare:

- Fee records
- Timetable images
- Exam date sheets
- Course materials
- Announcements
- Notifications
- AI knowledge
- Chatbot examples

---

# Recommended Demo Accounts

Prepare:

- 1 Admin account
- 1 HOD account
- 2–3 Teacher accounts
- Multiple Student accounts

At least one student should have:

- Good attendance
- Low attendance in one course
- Approved marks
- Fee balance
- Timetable
- Exams
- Materials

This makes the demo more realistic.

---

# PHASE 22 — Final Presentation Preparation

## Sian Should Demonstrate

- Admin login
- Academic structure
- Student management
- Teacher management
- Bulk import
- Course assignment
- Student enrollment
- Semester promotion

---

## Tayabba Should Demonstrate

- Teacher login
- Attendance
- Attendance shortage
- Assessments
- Marks
- Result submission
- HOD approval
- GPA
- Result card

---

## Hammad Should Demonstrate

- Student dashboard
- Fees
- Timetable
- Exams
- Course materials
- Announcements
- Notifications
- Gemini chatbot

---

# Final Responsibility Matrix

| Module | Primary Owner | Supporting Member |
|---|---|---|
| Authentication | Sian | All |
| User Roles | Sian | All |
| Students | Sian | — |
| Teachers | Sian | — |
| HOD Management | Sian | — |
| Departments | Sian | — |
| Programs | Sian | — |
| Batches | Sian | — |
| Semesters | Sian | Tayabba |
| Sections | Sian | — |
| Courses | Sian | Tayabba |
| Enrollment | Sian | Tayabba |
| Teacher Assignment | Sian | Tayabba |
| Bulk Import | Sian | — |
| Semester Promotion | Sian | Tayabba |
| Search/Filters | Sian | All |
| Attendance | Tayabba | Sian |
| Attendance Shortage | Tayabba | Hammad |
| Assessments | Tayabba | — |
| Marks | Tayabba | — |
| Grades | Tayabba | — |
| GPA/CGPA | Tayabba | — |
| Result Submission | Tayabba | — |
| HOD Approval | Tayabba | Sian |
| Result Card | Tayabba | Hammad |
| Fees | Hammad | Sian |
| Timetable | Hammad | Sian |
| Exam Date Sheet | Hammad | Sian |
| Course Materials | Hammad | Sian |
| Announcements | Hammad | — |
| Notifications | Hammad | All |
| Student Dashboard | Hammad | Tayabba |
| Teacher Dashboard | Tayabba | — |
| HOD Dashboard | Tayabba | Sian |
| Admin Dashboard | Sian | — |
| Audit Logs | Sian | Tayabba/Hammad |
| AI Knowledge | Hammad | All |
| Gemini Chatbot | Hammad | Sian/Tayabba |
| Responsive UI | All | Hammad coordinates |
| Testing | All | — |
| Demo Preparation | All | — |

---

# Recommended Development Order

The team should follow this order:

## Stage 1 — Foundation

### Sian
- Authentication
- Roles
- Academic structure
- Users

### Tayabba
- Attendance/marks/result page skeletons

### Hammad
- Student-service page skeletons
- Dashboard layout
- Chatbot UI placeholder

---

## Stage 2 — Academic Connections

### Sian
- Courses
- Enrollment
- Teacher assignment

### Tayabba
- Connect attendance to real courses/students

### Hammad
- Connect student services to logged-in students

---

## Stage 3 — Main Academic Features

### Tayabba
- Attendance
- Assessments
- Marks
- Results
- GPA

### Sian
- Support academic configuration

### Hammad
- Fees
- Timetable
- Exams
- Materials

---

## Stage 4 — Communication and Dashboards

### Hammad
- Announcements
- Notifications
- Student dashboard

### Tayabba
- Teacher/HOD dashboards

### Sian
- Admin dashboard
- Semester promotion

---

## Stage 5 — AI

Only after the portal already contains real student information.

### Hammad
- Knowledge base
- Gemini chatbot

### Sian
- Student/course identity integration

### Tayabba
- Attendance/results integration

---

## Stage 6 — Finalization

All three:

- Audit all permissions
- Test complete workflows
- Fix bugs
- Improve responsive UI
- Populate demo data
- Prepare presentation

---

# Important Team Rule

Do not develop the project as:

> Sian builds frontend  
> Tayabba builds backend  
> Hammad builds AI

That division creates too many dependencies and makes it difficult for each member to fully understand their work.

Instead, each member should **own complete functional modules**.

For example:

Tayabba should own the complete attendance feature from:

> Teacher marks attendance → student sees attendance → HOD monitors shortages.

Hammad should own the complete timetable feature from:

> Admin uploads timetable → correct student views timetable.

Sian should own the complete student setup from:

> Admin creates student → assigns academic structure → student logs in → courses are assigned.

This will make development, testing, debugging, documentation, and FYP defense significantly easier.

---

# Final Ownership Summary

## Sian — Core Academic System

Owns:

> Authentication + Users + Academic Structure + Courses + Enrollment + Admin Management + Semester Lifecycle

## Tayabba — Academic Performance System

Owns:

> Attendance + Assessments + Marks + Grades + GPA + Results + HOD Academic Approval

## Hammad — Student Services & AI

Owns:

> Fees + Timetable + Exams + Materials + Announcements + Notifications + Student Experience + Gemini Chatbot

This division should be treated as the team's primary development plan unless the workload needs to be rebalanced later.