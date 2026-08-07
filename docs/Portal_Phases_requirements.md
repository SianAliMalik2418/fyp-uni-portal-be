# University Portal with AI Academic Assistant

## Team-Based Phased Requirements & Build Plan — FE/BE Breakdown

**Team Members:** Sian, Tayabba, Hammad
**Project:** University Portal with AI Academic Assistant
**Institution:** NCBA&E
**Project Type:** Final Year Project

---

# 1. Purpose of This Plan

This document divides the complete FYP into ordered development phases and assigns clear ownership to each team member.

Each functional responsibility is further divided into:

* **FE — Frontend responsibilities**
* **BE — Backend responsibilities**

The aim is to ensure that:

* Everyone knows exactly what they are responsible for.
* Each person owns both the frontend and backend of their assigned modules.
* Features are developed in the correct dependency order.
* Team members can work in parallel where possible.
* No member builds features that depend on unfinished data from another member.
* Each member owns meaningful parts of the final project.
* Features can be tested phase by phase.
* The final project can be integrated gradually instead of at the end.

The ownership remains:

### Sian — Core Academic Management

Sian mainly owns:

* Authentication flows
* User management
* Academic structure
* Students
* Teachers
* HODs
* Departments
* Programs
* Batches
* Semesters
* Sections
* Courses
* Course assignments
* Enrollment
* Semester promotion
* Search and filtering

### Tayabba — Academic Performance Management

Tayabba mainly owns:

* Attendance
* Attendance percentages
* Attendance shortages
* Assessment structure
* Quizzes
* Assignments
* Marks
* Grades
* GPA
* CGPA
* Result submission
* HOD approval
* Result cards

### Hammad — Student Services & AI

Hammad mainly owns:

* Fee information
* Timetable
* Examination date sheet
* Course materials
* Announcements
* Notifications
* Student dashboard
* AI knowledge base
* Gemini chatbot
* AI student queries

---

# PHASE 1 — Basic Project User Flow

## Objective

Create the basic portal experience where users can log in and see different areas according to their role.

This phase should be completed before building actual university modules.

---

# Sian — Phase 1 Responsibilities

## Functional Requirements

The system must recognize four roles:

* Student
* Teacher
* HOD
* Admin

All roles log in using:

* Email address
* Password

The system must not provide public signup or self-registration. Developers seed the first admin account, and that admin creates student, teacher, HOD, and additional admin accounts from inside the portal.

Registration numbers and employee IDs are academic/administrative identifiers only. They are not login credentials.

The system must support:

* Seeded initial admin account
* Admin-created user accounts
* Login
* Logout
* Temporary passwords
* Mandatory first-login password change
* Active/inactive accounts
* Fixed role-based access

---

## Sian — FE

Build the common login screen.

The login screen should contain:

* Email field
* Password field
* Login button
* Validation messages
* Invalid-login state
* Inactive-account state
* Loading state

Build the mandatory password-change screen.

The screen should contain:

* Current temporary password if required
* New password
* Confirm password
* Submit action

Create protected role layouts.

### Student Navigation

* Dashboard
* Courses
* Attendance
* Results
* Fees
* Timetable
* Exams
* Materials
* Announcements

### Teacher Navigation

* Dashboard
* Courses
* Attendance
* Assessments
* Results
* Materials

### HOD Navigation

* Dashboard
* Department
* Courses
* Teachers
* Attendance
* Results

### Admin Navigation

* Dashboard
* Students
* Teachers
* Departments
* Programs
* Academic Structure
* Courses
* Fees
* Timetables
* Exams
* Announcements

Also implement:

* Logout action
* Unauthorized-page handling
* Login redirection based on role
* Basic account/profile dropdown

---

## Sian — BE

Implement user authentication requirements.

Backend must:

* Accept email and password.
* Authenticate only existing admin-created or seeded accounts.
* Avoid public signup/self-registration endpoints.
* Verify credentials.
* Check account status.
* Reject inactive users.
* Identify user role.
* Return authenticated session information.
* Support logout.
* Support temporary-password state.
* Require password change before normal portal use where necessary.
* Allow multiple active user sessions.
* Restrict protected operations based on role.
* Provide a seed mechanism for the initial admin account.

Backend should provide current-user information so the frontend knows:

* User ID
* Name
* Role
* Account status
* Whether password change is required

---

# Tayabba — Phase 1 Responsibilities

Prepare placeholder academic-performance areas.

---

## Tayabba — FE

Create basic placeholder pages for:

* Attendance
* Assessments
* Marks
* Results

Prepare role-specific empty states.

Examples:

Teacher:

> No assigned courses available yet.

Student:

> No attendance records available yet.

HOD:

> No results awaiting approval.

Create base layouts that can later hold:

* Attendance tables
* Assessment forms
* Marks tables
* Result approval tables

---

## Tayabba — BE

No full academic logic is required yet.

Prepare the backend/module boundaries needed later for:

* Attendance
* Assessments
* Marks
* Results

Temporary endpoints or empty responses may be used where required for frontend integration.

They should still respect role authorization.

---

# Hammad — Phase 1 Responsibilities

Prepare student-service areas.

---

## Hammad — FE

Create placeholder pages for:

* Fees
* Timetable
* Exams
* Course materials
* Announcements

Also create:

* Empty notification panel
* Basic student dashboard shell
* Floating chatbot button
* Closed chatbot panel state

The chatbot does not need to answer questions yet.

---

## Hammad — BE

Prepare basic module boundaries for:

* Fees
* Timetable
* Exams
* Materials
* Announcements
* Notifications
* AI assistant

No complete business logic is required in this phase.

---

## Phase 1 Completion Criteria

Phase 1 is complete when:

* All four roles can log in.
* Each role sees different navigation.
* Unauthorized sections cannot be opened.
* Temporary password change works.
* Inactive account login is blocked.
* Users can log out.
* All future major pages have placeholders.

---

# PHASE 2 — Academic Structure

## Objective

Create the university hierarchy that every later feature depends on.

---

# Sian — Phase 2 Owner

Sian owns this complete phase.

---

## 1. Department Management

Admin can:

* Add department
* View departments
* Edit department
* Delete department

Fields:

* Department name
* Department code
* Description
* Active status

### Sian — FE

Build:

* Department listing page
* Add department form
* Edit department form
* Delete confirmation
* Empty state
* Loading state
* Success/error feedback

### Sian — BE

Backend must support:

* Creating department
* Reading departments
* Updating department
* Deleting department
* Validating required fields
* Preventing invalid duplicate records where necessary

---

## 2. Program Management

Fields:

* Program name
* Program code
* Department
* Total semesters
* Duration
* Active status

### Sian — FE

Build:

* Program listing
* Program form
* Department selection
* Edit program
* Delete program
* Program details if needed

### Sian — BE

Backend must:

* Create programs
* Associate programs with departments
* Retrieve program lists
* Update programs
* Delete programs
* Validate department relationship

---

## 3. Batch Management

Fields:

* Batch name
* Program
* Starting year
* Expected graduation year
* Active status

### Sian — FE

Build:

* Batch list
* Add batch
* Edit batch
* Delete batch
* Program selector

### Sian — BE

Support:

* Create batch
* Read batches
* Update batch
* Delete batch
* Associate batch with program

---

## 4. Semester Management

The portal supports one active semester at a time.

### Sian — FE

Build:

* Semester list
* Add semester
* Activate semester action
* Close semester action
* Active-semester indicator
* Confirmation before changing active semester

### Sian — BE

Support:

* Create semester
* Retrieve semesters
* Set semester active
* Close semester
* Ensure only one semester is active at a time
* Preserve previous-semester records

---

## 5. Section Management

Section belongs to:

* Program
* Batch
* Semester

Fields:

* Section name
* Program
* Batch
* Semester
* Active status

### Sian — FE

Build:

* Section list
* Add section form
* Program selector
* Batch selector
* Semester selector
* Edit section
* Delete section

### Sian — BE

Support:

* Section creation
* Section retrieval
* Section updates
* Section deletion
* Relationship validation

---

# Tayabba — Phase 2 Responsibilities

## Tayabba — FE

Review future academic screens and ensure they can display:

* Program
* Semester
* Section

No major functional pages are required.

## Tayabba — BE

Verify later attendance/results logic can identify:

* Current semester
* Student section
* Program relationship

No complete attendance/result implementation yet.

---

# Hammad — Phase 2 Responsibilities

## Hammad — FE

Prepare later student-service filters/selectors to understand:

* Program
* Semester
* Section

## Hammad — BE

Verify timetable, exam, and AI modules can reference:

> Program + Semester + Section

---

## Phase 2 Completion Criteria

Admin can create:

> Computer Science → BSCS → Fall 2023 → Semester 8 → Section A

without manual database work.

---

# PHASE 3 — Student, Teacher and HOD Management

## Objective

Populate the portal with actual university users.

---

# Sian — Phase 3 Owner

## 1. Student Creation

Student fields:

* Full name
* Registration number
* Email
* Phone number
* Department
* Program
* Batch
* Semester
* Section
* Academic status
* Account status
* Profile picture if needed

Academic statuses:

* Active
* Frozen
* Repeating
* Dropped
* Graduated

---

## Sian — FE

Build:

* Student list
* Add student form
* Edit student form
* Student profile/details page
* Academic-status selector
* Account-status selector
* Program/batch/semester/section selectors
* Search-ready list structure
* Delete confirmation if included

Student-facing profile page should display information in read-only form.

---

## Sian — BE

Support:

* Student creation
* Student update
* Student retrieval
* Student deletion
* User account association
* Academic structure association
* Academic status
* Account status
* Registration-number uniqueness
* Email uniqueness

---

## 2. Bulk Student Import

### Sian — FE

Build:

* Upload file interface
* Import button
* Processing state
* Import result summary

Show:

* Total rows
* Successful rows
* Failed rows

Failed row list should show:

* Row number
* Student information where available
* Failure reason

---

### Sian — BE

Bulk import must:

* Accept CSV/Excel student data.
* Validate every row.
* Import valid rows.
* Skip invalid rows.
* Prevent duplicates.
* Return detailed result summary.

Possible failures:

* Duplicate registration
* Duplicate email
* Missing name
* Invalid program
* Invalid semester
* Invalid section
* Missing required fields

---

## 3. Teacher Management

### Sian — FE

Build:

* Teacher list
* Add teacher
* Edit teacher
* Teacher profile
* Department selector
* Designation field
* Account-status control

Teacher-facing profile remains read-only.

### Sian — BE

Support:

* Teacher creation
* Employee ID uniqueness
* Email uniqueness
* Department association
* Teacher update
* Teacher retrieval
* Teacher deletion
* Account status

---

## 4. HOD Management

### Sian — FE

Allow admin to:

* Create HOD account or assign HOD role
* Select department
* View assigned HOD

### Sian — BE

Support:

* HOD account
* Department association
* HOD role permissions
* HOD retrieval by department

---

## 5. Admin Password Reset

### Sian — FE

Admin should have a reset-password action on user accounts.

Show confirmation and success state.

### Sian — BE

Backend should:

* Reset user password.
* Mark new password as temporary.
* Require password change at next login.

---

# Tayabba — Phase 3 Responsibilities

## Tayabba — FE

Prepare attendance and result tables to use real student information:

* Name
* Registration number
* Semester
* Section

## Tayabba — BE

Ensure future academic requests can consume student identifiers and academic relationships provided by Sian's modules.

---

# Hammad — Phase 3 Responsibilities

## Hammad — FE

Connect placeholder student pages to the authenticated student's identity.

## Hammad — BE

Prepare service modules to retrieve the logged-in student's:

* Program
* Semester
* Section
* User ID

for future fee/timetable/AI features.

---

## Phase 3 Completion Criteria

Admin, HOD, teachers, and students exist and can log in.

---

# PHASE 4 — Courses, Teacher Assignment and Student Enrollment

## Objective

Connect courses, students, teachers, sections, and semesters.

---

# Sian — Phase 4 Owner

## Course Management

Fields:

* Course code
* Course title
* Credit hours
* Department
* Program
* Semester
* Description
* Active status

### Sian — FE

Build:

* Course list
* Add course
* Edit course
* Delete course
* Course details
* Program/semester selectors

### Sian — BE

Support:

* Course creation
* Course retrieval
* Course update
* Course deletion
* Academic relationship validation

---

## Course Assignment

Admin assigns courses to:

> Program → Semester → Section

### Sian — FE

Build course-assignment page.

Admin should:

* Choose program
* Choose semester
* Choose section
* Select courses
* Save assignment

Display currently assigned courses.

### Sian — BE

Support:

* Assigning courses to section
* Retrieving section course set
* Updating course assignments

---

## Automatic Enrollment

### Sian — FE

No complex student action is required.

Student course page should automatically display assigned courses.

### Sian — BE

When courses are assigned:

* Enroll all active students in the section.

When a new student joins:

* Automatically create required course enrollments.

Students must never self-enroll.

---

## Teacher Assignment

### Sian — FE

Admin/HOD can:

* Open course offering
* Select teacher
* Change assigned teacher

Teacher list should be limited appropriately.

### Sian — BE

Support:

* One teacher per course section
* Teacher assignment
* Teacher reassignment
* Retrieval of teacher course sections

---

## Student Course View

### Sian — FE

Show:

* Course code
* Course title
* Credit hours
* Teacher

### Sian — BE

Return only courses assigned to authenticated student.

---

## Teacher Course View

### Sian — FE

Show:

* Assigned courses
* Section
* Student count

### Sian — BE

Return only teacher's assigned offerings.

---

# Tayabba — Phase 4 Responsibilities

## Tayabba — FE

Attendance and marks screens should now use real course offerings.

Teacher should select only assigned courses.

## Tayabba — BE

Academic modules must validate:

* Teacher owns course section.
* Student belongs to enrollment.
* Unauthorized course access is rejected.

---

# Hammad — Phase 4 Responsibilities

## Hammad — FE

Course materials and AI placeholders can now show real student courses.

## Hammad — BE

Prepare access to:

* Student enrolled courses
* Assigned teacher information

---

## Phase 4 Completion Criteria

Student sees assigned courses.

Teacher sees only assigned course sections.

---

# PHASE 5 — Attendance Management

## Objective

Complete the first major teacher-to-student academic workflow.

---

# Tayabba — Phase 5 Owner

## Tayabba — FE

### Attendance Creation Screen

Teacher:

1. Selects assigned course.
2. Selects date.
3. Sees enrolled students.

Student table displays:

* Registration number
* Name
* Status selector

Statuses:

* Present
* Absent
* Leave

Provide:

* Save action
* Loading state
* Validation feedback
* Success confirmation

---

### Attendance History

Teacher sees previous attendance sessions.

Display:

* Date
* Course
* Student count

Opening a session shows individual attendance records.

Teacher can edit previous attendance.

---

### Student Attendance Page

For every course show:

* Total classes
* Present
* Absent
* Leave
* Attendance percentage
* Required percentage
* Warning state

---

### HOD Attendance Screen

Show:

* Students below attendance threshold
* Course
* Student
* Percentage
* Required percentage

---

## Tayabba — BE

Implement:

* Create attendance session
* One session per course section/date
* Retrieve enrolled students
* Save individual attendance statuses
* Edit attendance
* Retrieve attendance history
* Retrieve student course attendance
* Calculate totals
* Calculate percentages
* Detect attendance shortages
* Retrieve low-attendance students for HOD

Teachers must only manage their assigned course sections.

---

# Sian — Phase 5 Responsibilities

## Sian — FE

Add admin setting for minimum attendance percentage.

## Sian — BE

Store and expose attendance threshold configuration.

Provide:

* Course sections
* Enrollments
* Active semester
* Teacher assignments

---

# Hammad — Phase 5 Responsibilities

## Hammad — FE

Student dashboard should contain:

* Attendance summary
* Low-attendance warnings
* Quick link to attendance page

## Hammad — BE

Consume attendance summary from Tayabba's module for dashboard display.

---

## Phase 5 Completion Criteria

Teacher marks attendance → percentage calculates → student sees it → HOD sees shortages.

---

# PHASE 6 — Assessments and Marks

## Objective

Allow teachers to enter complete semester assessment information.

---

# Tayabba — Phase 6 Owner

## Tayabba — FE

### Assessment Category View

Teacher should see university-defined categories:

* Assignments
* Quizzes
* Midterm
* Final

### Assessment Creation

Teacher can create:

* Quiz 1
* Quiz 2
* Assignment 1
* Assignment 2
* etc.

Fields:

* Assessment name
* Category
* Maximum marks

### Marks Entry

Build spreadsheet-style table containing:

* Registration number
* Student
* Numeric marks/status

Supported status values:

* Absent
* Exempted
* Result Withheld

Provide:

* Save draft
* Validation errors
* Missing marks indication
* Maximum marks display

---

## Tayabba — BE

Support:

* Assessment creation within allowed categories
* Maximum marks
* Multiple assessments in categories
* Marks creation
* Marks updates
* Draft saving
* Special statuses
* Marks validation
* Category aggregation
* Weighted calculation

Reject marks above maximum.

---

# Sian — Phase 6 Responsibilities

## Sian — FE

Admin gets assessment-structure configuration page.

Admin sets:

* Categories
* Weightages

Display total percentage.

Prevent saving invalid configuration.

## Sian — BE

Store university-wide assessment structure.

Ensure configured total equals 100%.

Expose active structure to Tayabba's module.

---

# Hammad — Phase 6 Responsibilities

## Hammad — FE

Prepare student dashboard components for:

* Recent marks
* Academic summary

Do not display unpublished results.

## Hammad — BE

Consume only permitted published academic information.

---

## Phase 6 Completion Criteria

Teacher can create assessments, enter marks, and save drafts.

---

# PHASE 7 — Results, Grades, GPA and HOD Approval

## Objective

Turn assessment marks into official results.

---

# Tayabba — Phase 7 Owner

## Tayabba — FE

### Teacher Result Review

Display:

* Student
* Assessment totals
* Final percentage
* Grade
* Grade point

Teacher can:

* Review
* Submit result

Show submission status:

* Draft
* Pending HOD Approval
* Returned
* Approved

---

### HOD Result Review

Display:

* Course
* Section
* Teacher
* Students
* Marks
* Grades
* Summary statistics

Actions:

* Approve
* Return with comments

---

### Returned Result

Teacher sees:

* HOD comments
* Returned status
* Ability to correct records

---

### Approved Student Result

Student can view published result.

---

### Result Reopening

HOD/Admin sees:

* Reopen action
* Reason field
* Confirmation

---

## Tayabba — BE

Implement:

* Weighted final calculations
* Letter-grade mapping
* Grade points
* GPA calculation
* CGPA calculation
* Result submission
* Result state management
* HOD approval
* Return with comments
* Result locking
* Result reopening
* Reason storage
* Published result retrieval

Only approved results should become student-visible.

---

# Sian — Phase 7 Responsibilities

## Sian — FE

Admin grading-scale configuration page.

Fields:

* Minimum percentage
* Maximum percentage
* Letter grade
* Grade point

## Sian — BE

Store grading scale.

Validate:

* Percentage ranges
* Grade-point data
* HOD/Admin permissions for reopening results

---

# Hammad — Phase 7 Responsibilities

## Hammad — FE

Student dashboard shows:

* Latest published result
* GPA
* Result notification

## Hammad — BE

Notification generation/consumption for published result.

---

## Phase 7 Completion Criteria

Teacher submits → HOD approves/returns → student sees only approved result.

---

# PHASE 8 — Student Result Card

## Objective

Provide downloadable semester result output.

---

# Tayabba — Phase 8 Owner

## Tayabba — FE

Create result-card view.

Include:

* Student name
* Registration number
* Program
* Semester
* Course codes
* Course titles
* Credit hours
* Marks
* Grades
* Grade points
* Semester GPA

Provide:

* View result card
* Download result card

Only approved results appear.

---

## Tayabba — BE

Backend must:

* Retrieve complete approved semester result.
* Include student academic details.
* Include courses and credit hours.
* Include GPA.
* Prevent generating cards for unpublished results.

---

# Sian — Phase 8 Responsibilities

## Sian — BE

Provide accurate:

* Student identity
* Program
* Semester
* Course metadata

## Sian — FE

No major separate screen required beyond ensuring profile data displays correctly.

---

# Hammad — Phase 8 Responsibilities

## Hammad — FE

Link result card from:

* Student dashboard
* Results page

---

## Phase 8 Completion Criteria

Student downloads complete approved semester result card.

---

# PHASE 9 — Fee Information

## Objective

Allow students to check fee information.

---

# Hammad — Phase 9 Owner

## Hammad — FE

### Admin Fee Page

Admin should:

* Find/select student.
* Enter total semester fee.
* Enter paid amount.
* Enter due date.
* Enter payment date.
* Enter notes.

Display calculated:

* Remaining amount
* Fee status

### Student Fee Page

Display:

* Total fee
* Paid
* Remaining
* Due date
* Payment status
* Payment information

No payment actions.

---

## Hammad — BE

Support:

* Create/update student fee record
* Retrieve student fee
* Calculate remaining amount
* Determine fee status
* Restrict modification to Admin
* Restrict student access to own fee information

---

# Sian — Phase 9 Responsibilities

## Sian — BE

Provide student lookup and identity relationships.

## Sian — FE

Provide reusable student selector/search if required by fee administration.

---

# Tayabba — Phase 9 Responsibilities

Test fee information and ensure it does not interfere with academic workflows.

---

## Phase 9 Completion Criteria

Admin updates fee → correct student sees current fee status.

---

# PHASE 10 — Timetable and Exam Date Sheet

## Objective

Provide scheduling information without timetable-generation logic.

---

# Hammad — Phase 10 Owner

## Timetable — FE

Admin page should allow:

* Select program
* Select semester
* Select section
* Upload timetable image
* Replace timetable image
* View existing timetable

Student page:

* Display current section timetable.

Teacher page:

* Display relevant timetables.

---

## Timetable — BE

Support:

* Timetable image upload
* Program association
* Semester association
* Section association
* Timetable replacement
* Student-specific retrieval
* Teacher-relevant retrieval

---

## Exam Date Sheet — FE

Admin can create exam entry with:

* Exam type
* Course
* Program
* Semester
* Section
* Date
* Start time
* End time
* Room
* Instructions

Student sees relevant exams.

Teacher sees relevant exams.

---

## Exam Date Sheet — BE

Support:

* Create exam record
* Update exam
* Delete exam
* Retrieve exams by student enrollment
* Retrieve exams by teacher course assignment

No automatic scheduling logic.

---

# Sian — Phase 10 Responsibilities

Provide reusable:

* Program
* Semester
* Section
* Course data

on both FE selectors and BE relationships.

---

# Tayabba — Phase 10 Responsibilities

Ensure exam-course relationships remain compatible with academic modules.

---

## Phase 10 Completion Criteria

Correct student sees correct timetable and exams.

---

# PHASE 11 — Course Materials

## Objective

Allow teachers to share academic resources.

---

# Hammad — Phase 11 Owner

## Hammad — FE

Teacher materials page:

* Select assigned course
* Add material
* Add title
* Add description
* Upload file
* Add external link
* View current materials
* Remove material

Student page:

* Select/view course materials
* Display simple list
* Download/view file
* Open external link

Supported:

* PDF
* DOCX
* PPTX
* XLSX
* JPG
* JPEG
* PNG

---

## Hammad — BE

Support:

* Material file upload
* File metadata storage
* External links
* Course association
* Teacher ownership verification
* Student enrollment verification
* File retrieval/download access
* Material deletion

Teacher must only upload for assigned courses.

Student must only access enrolled-course material.

---

# Sian — Phase 11 Responsibilities

Provide:

* Enrollment checks
* Teacher course assignments

---

# Tayabba — Phase 11 Responsibilities

Permission and integration testing.

---

## Phase 11 Completion Criteria

Teacher uploads material → enrolled student accesses it.

---

# PHASE 12 — Announcements and Notifications

## Objective

Add internal university communication.

---

# Hammad — Phase 12 Owner

## Announcements — FE

Admin can:

* Create announcement
* Edit announcement
* Delete announcement
* Pin announcement
* Set expiry

Fields:

* Title
* Description
* Publish date
* Expiry date
* Attachment
* Pinned status
* Active status

All users get announcement page/view.

---

## Announcements — BE

Support:

* Create
* Retrieve
* Update
* Delete
* Active/expired filtering
* Pinned announcements
* Optional attachment

---

## Notifications — FE

Build:

* Notification icon
* Unread count
* Notification list
* Read/unread styling
* Mark as read
* Mark all as read

---

## Notifications — BE

Support:

* Create notification
* Retrieve user notifications
* Read/unread state
* Mark one read
* Mark all read

Notifications can come from other modules.

---

# Sian — Phase 12 Responsibilities

## Sian — BE

Trigger notifications for relevant core-account/course events where applicable.

---

# Tayabba — Phase 12 Responsibilities

## Tayabba — BE

Trigger:

* Attendance updated
* Result returned
* Result approved
* Result published

---

## Phase 12 Completion Criteria

Users receive relevant in-app notifications and manage read state.

---

# PHASE 13 — Role Dashboards

## Objective

Turn the portal into a useful day-to-day experience.

---

# Hammad — Student Dashboard Owner

## Hammad — FE

Display:

* Student information
* Current semester
* Courses
* Attendance percentages
* Attendance shortage
* Recent marks
* GPA
* Fee balance
* Recent materials
* Announcements
* Notifications
* AI chatbot button

## Hammad — BE

Create/retrieve combined student dashboard data from the relevant owned/shared modules.

---

# Tayabba — Teacher/HOD Dashboard Owner

## Tayabba — FE

### Teacher

Show:

* Assigned courses
* Sections
* Student counts
* Attendance activity
* Marks progress
* Draft results
* Pending submissions
* Returned results

### HOD

Show:

* Students
* Teachers
* Courses
* Low attendance
* Pending approvals
* Recently approved results
* Academic summary

## Tayabba — BE

Provide aggregated academic-performance dashboard information.

---

# Sian — Admin Dashboard Owner

## Sian — FE

Show:

* Total students
* Total teachers
* Departments
* Programs
* Current semester
* Sections
* Courses
* Recent imports
* Recent administrative activity

## Sian — BE

Provide admin summary counts and current academic-structure information.

---

## Phase 13 Completion Criteria

Each role sees a useful dashboard with real system information.

---

# PHASE 14 — Semester Promotion

## Objective

Allow progression into the next semester.

---

# Sian — Phase 14 Owner

## Sian — FE

Admin:

1. Select program.
2. Select batch.
3. Select section.
4. View students.
5. Select/exclude exceptional students.
6. Confirm promotion.

Show:

* Current semester
* Target semester
* Student list
* Status
* Confirmation warning
* Promotion result summary

---

## Sian — BE

Support:

* Retrieve promotion candidates
* Exclude selected students
* Promote remaining students
* Update current semester
* Assign next-semester course set when applicable
* Preserve previous records
* Respect student academic statuses

No complex section-transfer workflow.

---

# Tayabba — Phase 14 Responsibilities

## Tayabba — BE

Ensure historical:

* Attendance
* Results
* GPA

remain tied to previous semester.

## Tayabba — FE

Historical academic pages must still display old records.

---

# Hammad — Phase 14 Responsibilities

## Hammad — BE

Ensure current student services do not treat previous:

* Timetables
* Exams
* Materials

as current.

---

## Phase 14 Completion Criteria

Student moves semester without losing history.

---

# PHASE 15 — Audit Log

## Objective

Record important changes.

---

# Sian — Phase 15 Primary Owner

## Sian — FE

Build Admin audit-log page.

Display:

* User
* Role
* Action
* Module
* Date/time
* Affected record
* Reason

Provide basic filtering if useful.

---

## Sian — BE

Create central audit logging for important actions.

Sian's modules should log:

* Student creation
* Teacher creation
* Bulk imports
* Account changes
* Semester promotion
* Core academic changes

---

# Tayabba — Phase 15 Responsibilities

## Tayabba — BE

Log:

* Attendance changes
* Result submission
* Result approval
* Result return
* Result reopening
* Grading-related actions

---

# Hammad — Phase 15 Responsibilities

## Hammad — BE

Log:

* Fee updates
* Timetable changes
* Announcement actions
* Relevant student-service changes

---

## Phase 15 Completion Criteria

Admin can inspect important system changes from one location.

---

# PHASE 16 — Search and Filtering

## Objective

Make large amounts of data manageable.

---

# Sian — Phase 16 Owner

## Sian — FE

Student search by:

* Name
* Registration number
* Email

Filters:

* Department
* Program
* Batch
* Semester
* Section
* Account status

Teacher search by:

* Name
* Employee ID
* Email

Filters:

* Department
* Designation
* Account status

---

## Sian — BE

Support search/filter requests and return matching results efficiently.

---

# Tayabba — Phase 16 Responsibilities

## Tayabba — FE

Add filters for:

* Attendance shortages
* Results
* HOD academic views

## Tayabba — BE

Support related academic filtering.

---

# Hammad — Phase 16 Responsibilities

## Hammad — FE

Add simple search/filter where useful for:

* Materials
* Announcements

## Hammad — BE

Support lightweight filtering only where necessary.

---

## Phase 16 Completion Criteria

Admin and HOD can quickly locate required records.

---

# PHASE 17 — AI Knowledge Base Preparation

## Objective

Prepare trusted university knowledge.

---

# Hammad — Phase 17 Owner

## Hammad — FE

No end-user management interface is required.

There is no Admin AI knowledge screen.

Hammad may use internal development/testing views only if useful during development.

---

## Hammad — BE

Prepare developer-managed knowledge records.

Possible fields:

* Title
* Category
* Question
* Answer/information
* Keywords
* Active status
* Last updated

Categories:

* Attendance rules
* Passing rules
* Examination rules
* Grading policy
* Academic procedures
* Fee FAQs
* General university FAQs

Provide ability for chatbot logic to search these records.

---

# Sian — Phase 17 Responsibilities

## Sian — BE

Identify safe student-specific data sources:

* Courses
* Teachers
* Student identity
* Academic structure

---

# Tayabba — Phase 17 Responsibilities

## Tayabba — BE

Expose reliable student academic information for AI use:

* Attendance
* Marks
* Grades
* GPA
* Results

---

## Phase 17 Completion Criteria

Developer-maintained university knowledge is ready for chatbot queries.

---

# PHASE 18 — AI Academic Chatbot

## Objective

Implement the required AI feature.

---

# Hammad — Phase 18 Owner

## Hammad — FE

Build floating student chatbot.

Features:

* Floating button
* Open/close panel
* User messages
* AI messages
* Suggested questions
* Loading indicator
* Error state
* Clear session
* Mobile-friendly view

Support conversation follow-up during current session.

Do not provide permanent history.

---

## Hammad — BE

Chatbot should answer using:

### Personal Student Data

* Attendance
* Marks
* Grades
* GPA
* CGPA
* Courses
* Teachers
* Fee
* Timetable
* Exams
* Announcements
* Materials

### University Knowledge

* Developer-maintained knowledge records

Support:

* Clear personal questions
* General university questions
* Ambiguous/follow-up questions
* Gemini response generation
* Session conversation context
* Unknown-information fallback

The chatbot must be read-only.

It cannot:

* Change attendance
* Modify marks
* Edit profile
* Change fees
* Modify result
* Delete data

It must use authenticated student identity.

It must not allow arbitrary student lookup.

---

# Sian — Phase 18 Responsibilities

## Sian — BE

Provide secure AI-access functions for:

* Current authenticated student
* Courses
* Teachers
* Academic structure

Ensure Hammad's chatbot cannot ask for arbitrary student IDs.

---

# Tayabba — Phase 18 Responsibilities

## Tayabba — BE

Provide read-only AI-access functions for:

* Attendance
* Marks
* Grades
* GPA
* Results

Validate AI output against actual academic values.

---

## Phase 18 Completion Criteria

Student asks natural-language academic questions and receives correct, safe answers.

---

# PHASE 19 — UI and Responsive Polish

## Objective

Make the system consistent across devices.

---

# Hammad — Primary UI Coordinator

## Hammad — FE

Review:

* Student pages
* Chatbot
* Mobile navigation
* Cards
* Notifications
* Responsive layouts

---

# Sian — FE

Polish:

* Admin pages
* Authentication
* Students
* Teachers
* Academic structure
* Forms
* Search
* Tables

---

# Tayabba — FE

Polish:

* Attendance
* Assessments
* Marks
* Results
* HOD pages
* Result cards

---

## Shared FE Requirements

Use consistent:

* Page headings
* Form styles
* Button styles
* Tables
* Modals
* Confirmation dialogs
* Loading states
* Empty states
* Error states
* Mobile behavior

---

## Shared BE Review

All three should review:

* Consistent error responses
* Permissions
* Validation
* Module integration
* Missing edge cases
* Broken relationships

---

# PHASE 20 — End-to-End Testing

## Objective

Test full workflows across FE and BE.

---

# Scenario 1 — New Student

**Primary: Sian**

### FE Test

* Admin creates student.
* Student logs in.
* Temporary-password screen appears.
* Student sees correct courses.

### BE Test

Verify:

* Student record created.
* Academic relationships correct.
* Course enrollment created.
* Login and password-change state correct.

---

# Scenario 2 — Attendance

**Primary: Tayabba**

### FE Test

* Teacher marks attendance.
* Student sees it.
* HOD sees shortage.

### BE Test

Verify:

* Correct course session.
* No duplicate date session.
* Correct percentage.
* Correct threshold warning.

---

# Scenario 3 — Results

**Primary: Tayabba**

### FE Test

Teacher:

* Creates assessment.
* Enters marks.
* Submits.

HOD:

* Returns.
* Approves.

Student:

* Sees result.
* Downloads card.

### BE Test

Verify:

* Weightages
* Grade
* GPA
* Result statuses
* Approval locking
* Reopening

---

# Scenario 4 — Fees

**Primary: Hammad**

### FE

Admin updates → student views.

### BE

Verify correct student's fee only.

---

# Scenario 5 — Timetable

**Primary: Hammad**

### FE

Correct section sees timetable.

### BE

Wrong-section student must not receive timetable.

---

# Scenario 6 — Course Materials

**Primary: Hammad**

### FE

Teacher uploads → student downloads.

### BE

Verify:

* Teacher assignment
* Student enrollment
* File authorization

---

# Scenario 7 — AI

**Primary: Hammad**

### FE

Test chatbot flow and follow-ups.

### BE

Test:

* Correct student context
* Correct attendance/result values
* University knowledge
* No unauthorized student data
* No modification capabilities

---

# PHASE 21 — Demo Data Preparation

## Sian

### FE/Functional Data

Prepare visible:

* Departments
* Programs
* Batches
* Semesters
* Sections
* Students
* Teachers
* HOD
* Courses

### BE/Data State

Ensure relationships and enrollments are valid.

---

## Tayabba

Prepare:

* Attendance sessions
* Quizzes
* Assignments
* Midterms
* Finals
* Pending result
* Returned result
* Approved result
* GPA examples

---

## Hammad

Prepare:

* Fees
* Timetable images
* Exams
* Materials
* Announcements
* Notifications
* AI knowledge
* Chatbot questions

---

# PHASE 22 — Final Presentation Preparation

## Sian Demonstration

Show both FE behavior and underlying feature workflow for:

* Admin login
* Academic structure
* Students
* Teachers
* Bulk import
* Courses
* Enrollment
* Semester promotion

---

## Tayabba Demonstration

Show:

* Teacher attendance
* Student attendance
* Attendance warning
* Assessments
* Marks
* Result submission
* HOD approval
* GPA
* Result card

---

## Hammad Demonstration

Show:

* Student dashboard
* Fees
* Timetable
* Exams
* Materials
* Announcements
* Notifications
* Gemini chatbot

---

# Final FE/BE Ownership Matrix

| Module              | Primary Owner | FE Owner | BE Owner | Support            |
| ------------------- | ------------- | -------- | -------- | ------------------ |
| Authentication      | Sian          | Sian     | Sian     | All                |
| User Roles          | Sian          | Sian     | Sian     | All                |
| Students            | Sian          | Sian     | Sian     | —                  |
| Teachers            | Sian          | Sian     | Sian     | —                  |
| HOD Management      | Sian          | Sian     | Sian     | —                  |
| Departments         | Sian          | Sian     | Sian     | —                  |
| Programs            | Sian          | Sian     | Sian     | —                  |
| Batches             | Sian          | Sian     | Sian     | —                  |
| Semesters           | Sian          | Sian     | Sian     | Tayabba            |
| Sections            | Sian          | Sian     | Sian     | —                  |
| Courses             | Sian          | Sian     | Sian     | Tayabba            |
| Enrollment          | Sian          | Sian     | Sian     | Tayabba            |
| Teacher Assignment  | Sian          | Sian     | Sian     | Tayabba            |
| Bulk Import         | Sian          | Sian     | Sian     | —                  |
| Semester Promotion  | Sian          | Sian     | Sian     | Tayabba            |
| Search/Filters      | Sian          | Sian     | Sian     | All                |
| Attendance          | Tayabba       | Tayabba  | Tayabba  | Sian               |
| Attendance Shortage | Tayabba       | Tayabba  | Tayabba  | Hammad             |
| Assessments         | Tayabba       | Tayabba  | Tayabba  | —                  |
| Marks               | Tayabba       | Tayabba  | Tayabba  | —                  |
| Grades              | Tayabba       | Tayabba  | Tayabba  | Sian               |
| GPA/CGPA            | Tayabba       | Tayabba  | Tayabba  | —                  |
| Result Submission   | Tayabba       | Tayabba  | Tayabba  | —                  |
| HOD Approval        | Tayabba       | Tayabba  | Tayabba  | Sian               |
| Result Card         | Tayabba       | Tayabba  | Tayabba  | Hammad             |
| Fees                | Hammad        | Hammad   | Hammad   | Sian               |
| Timetable           | Hammad        | Hammad   | Hammad   | Sian               |
| Exam Date Sheet     | Hammad        | Hammad   | Hammad   | Sian               |
| Course Materials    | Hammad        | Hammad   | Hammad   | Sian               |
| Announcements       | Hammad        | Hammad   | Hammad   | —                  |
| Notifications       | Hammad        | Hammad   | Hammad   | All                |
| Student Dashboard   | Hammad        | Hammad   | Hammad   | Tayabba            |
| Teacher Dashboard   | Tayabba       | Tayabba  | Tayabba  | —                  |
| HOD Dashboard       | Tayabba       | Tayabba  | Tayabba  | Sian               |
| Admin Dashboard     | Sian          | Sian     | Sian     | —                  |
| Audit Logs          | Sian          | Sian     | Sian     | Tayabba/Hammad     |
| AI Knowledge        | Hammad        | —        | Hammad   | All                |
| Gemini Chatbot      | Hammad        | Hammad   | Hammad   | Sian/Tayabba       |
| Responsive UI       | All           | All      | —        | Hammad coordinates |
| Testing             | All           | All      | All      | —                  |

---

# Recommended Development Order

The original development order remains unchanged.

## Stage 1 — Foundation

### Sian

**FE**

* Login
* Password-change UI
* Role layouts
* Admin academic-structure pages

**BE**

* Authentication
* Roles
* User session
* Academic structure

### Tayabba

**FE**

* Attendance page skeleton
* Marks page skeleton
* Results page skeleton

**BE**

* Prepare academic module structure

### Hammad

**FE**

* Student-service skeletons
* Student dashboard shell
* Chatbot placeholder

**BE**

* Prepare student-service module structure

---

# Stage 2 — Academic Connections

### Sian

**FE**

* Course management
* Course assignment
* Teacher assignment
* Student course view

**BE**

* Courses
* Enrollments
* Automatic enrollment
* Teacher assignments

### Tayabba

**FE**

* Connect attendance screens to real teacher courses

**BE**

* Validate teacher/student/course relationships

### Hammad

**FE**

* Connect student pages to authenticated user

**BE**

* Use student/course relationships for future services

---

# Stage 3 — Main Academic Features

### Tayabba

**FE + BE**

* Attendance
* Assessments
* Marks
* Grades
* Results
* GPA
* HOD approval

### Sian

**FE + BE**

* Assessment configuration
* Grading configuration
* Supporting academic management

### Hammad

**FE + BE**

* Fees
* Timetable
* Exams
* Materials

---

# Stage 4 — Communication and Dashboards

### Hammad

**FE + BE**

* Announcements
* Notifications
* Student dashboard

### Tayabba

**FE + BE**

* Teacher dashboard
* HOD dashboard

### Sian

**FE + BE**

* Admin dashboard
* Semester promotion

---

# Stage 5 — AI

Only after real portal data exists.

### Hammad

**FE**

* Chat widget
* Chat interaction
* Session conversation UX

**BE**

* AI knowledge
* Gemini integration
* Question routing
* Student-service AI access

### Sian

**BE**

* Student identity
* Course information
* Teacher information
* Safe AI access

### Tayabba

**BE**

* Attendance AI access
* Marks AI access
* GPA/results AI access

---

# Stage 6 — Finalization

## FE — All Three

* Responsive fixes
* UI consistency
* Loading states
* Error states
* Empty states
* Confirmation dialogs
* End-to-end screen testing

## BE — All Three

* Permission review
* Data validation
* Error handling
* Cross-module integration
* Audit verification
* Security testing
* Demo-data consistency

---

# Important Team Rule

The team still should **not** divide work as:

> Sian = Frontend
> Tayabba = Backend
> Hammad = AI

Each member owns the **frontend and backend of their own functional area**.

For example:

### Sian

Owns:

> Admin Student Form → Student Creation Logic → Academic Assignment → Student Retrieval → Student Profile

### Tayabba

Owns:

> Teacher Attendance Screen → Attendance Saving → Percentage Calculation → Student Attendance Screen → HOD Warning Screen

### Hammad

Owns:

> Timetable Upload Screen → Timetable Storage → Student Timetable Retrieval → Student Timetable Screen

This means each member can explain their feature completely during the FYP defense:

> What the user sees → what action happens → how the system processes it → what data is returned → what the final result is.

---

# Final Ownership Summary

## Sian — Core Academic System

### FE

* Authentication UI
* Admin management UI
* Student/teacher management
* Academic structure
* Courses
* Enrollment
* Search
* Admin dashboard
* Semester promotion

### BE

* Authentication
* User management
* Academic relationships
* Courses
* Enrollment
* Teacher assignment
* Semester lifecycle
* Core authorization

---

## Tayabba — Academic Performance System

### FE

* Attendance
* Assessments
* Marks
* Results
* Teacher dashboard
* HOD dashboard
* Result card

### BE

* Attendance records
* Attendance calculations
* Assessment calculations
* Marks
* Grades
* GPA/CGPA
* Result workflow
* HOD approval

---

## Hammad — Student Services & AI

### FE

* Student dashboard
* Fees
* Timetable
* Exams
* Materials
* Announcements
* Notifications
* Floating AI chatbot

### BE

* Fee records
* Timetables
* Exam records
* File/material handling
* Announcements
* Notifications
* AI knowledge
* Gemini chatbot
* AI question handling

---

This FE/BE split should be used **inside the existing phase plan**, while keeping the same module ownership and phase order.
