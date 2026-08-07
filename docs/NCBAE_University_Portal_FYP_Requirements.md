# University Portal with AI Academic Assistant
## Final Year Project (FYP) Requirements Document

**Institution:** National College of Business Administration & Economics (NCBA&E)  
**Program:** BS Computer Science  
**Project Type:** Final Year Project  
**Core Technology Stack:** MERN Stack  
**AI Integration:** Google Gemini API  
**Project Category:** University Management / Academic Information System  

---

# 1. Project Title

**University Portal with AI Academic Assistant**

---

# 2. Project Overview

The proposed project is a centralized university portal designed to digitize and simplify common academic operations for students, teachers, Heads of Department (HODs), and university administrators.

The portal will provide a single web-based platform through which academic information can be managed and accessed. Instead of relying on separate manual processes, spreadsheets, notices, and disconnected systems, the university portal will organize student records, course assignments, attendance, assessments, results, fee information, timetable images, course materials, announcements, and academic dashboards in one place.

The system will be developed using the **MERN stack**, consisting of MongoDB, Express.js, React.js, and Node.js.

A major feature of the project will be an **AI-powered academic assistant** integrated using the **Google Gemini API**. The chatbot will allow students to ask natural-language questions about their own academic information and general university information. The chatbot will operate in a controlled, read-only manner and will not be allowed to modify any university records.

The project is designed as a practical academic management system rather than a complete university ERP. The initial version will focus on the most useful and realistic features that can be implemented within an FYP scope.

---

# 3. Problem Statement

University students often need to obtain academic information from multiple sources or manually contact university staff for routine information such as attendance, marks, fee status, examination dates, course information, announcements, and study materials.

Similarly, teachers and administrators may rely on spreadsheets, manual records, paper attendance, and separate files to manage academic information.

The absence of a centralized portal creates several problems, including:

- Difficulty accessing academic information quickly.
- Repeated dependency on university staff for routine queries.
- Manual maintenance of attendance and marks.
- Lack of centralized academic records.
- Difficulty monitoring student attendance and academic performance.
- Inconsistent communication of announcements and academic updates.
- Difficulty managing student, teacher, course, and semester information.
- Lack of a modern self-service academic system.
- No intelligent assistant capable of answering student-specific academic questions.

The proposed system aims to solve these problems by providing a centralized, role-based university portal.

---

# 4. Proposed Solution

The proposed solution is a responsive web-based university portal supporting four major user roles:

1. Student
2. Teacher
3. Head of Department / Academic Coordinator
4. Administrator

The system will provide academic management functionality according to each user's responsibilities.

The portal will include:

- User and account management
- Department and program management
- Batch, semester, and section management
- Course management
- Automatic student course assignment
- Teacher course assignment
- Attendance management
- Assessment and marks management
- Result approval
- GPA and grade calculation
- Result cards
- Fee information
- Timetable image management
- Examination date sheets
- Course materials
- Global announcements
- In-app notifications
- Role-specific dashboards
- Audit logging
- Student AI academic assistant

---

# 5. Project Objectives

The main objectives of this project are:

1. To develop a centralized university portal using the MERN stack.
2. To provide students with convenient access to their academic information.
3. To allow teachers to manage attendance, assessments, marks, and course materials.
4. To allow HODs to supervise courses, teacher assignments, and result approval.
5. To allow administrators to manage users, academic structures, fee information, timetables, grading rules, and announcements.
6. To automate grade, GPA, and attendance percentage calculations.
7. To reduce dependency on manual academic record management.
8. To implement secure role-based access control.
9. To integrate an AI academic chatbot using the Gemini API.
10. To allow students to ask natural-language questions about their academic information.
11. To provide a responsive user interface suitable for desktop, tablet, and mobile devices.
12. To maintain important academic activity through audit logs.

---

# 6. Scope of the System

The system will focus primarily on academic management and student self-service.

The portal will support the following roles:

- Student
- Teacher
- HOD / Academic Coordinator
- Administrator

The system will not attempt to provide every possible university ERP function.

The first version will specifically exclude:

- Online admissions
- Hostel management
- Transport management
- Library management
- Payroll
- HR management
- Online fee payment
- Student complaints or ticketing
- Course selection by students
- Automatic timetable generation
- Assignment submission
- Online quizzes
- Plagiarism detection
- Private messaging
- Parent portal
- Dedicated mobile application
- Automatic exam eligibility blocking
- Full document request workflows
- Permanent chatbot conversation history

---

# 7. User Roles

## 7.1 Student

Students will primarily use the portal to view their academic information.

A student will be able to:

- Log in using registration number or registered Gmail address.
- Change the temporary password during first login.
- View personal and academic profile information.
- View assigned courses.
- View assigned teacher information.
- View attendance.
- View attendance percentage for each course.
- View attendance shortage warnings.
- View assessments and marks after publication.
- View grades, GPA, and CGPA.
- View semester result card.
- View fee status.
- View timetable image.
- View exam date sheet.
- View course materials.
- View global announcements.
- Receive in-app notifications.
- Use the AI academic chatbot.

Students will not be allowed to edit academic profile information.

## 7.2 Teacher

Teachers will manage academic records for their assigned courses.

A teacher will be able to:

- Log in using employee ID or registered Gmail address.
- View teacher profile.
- View assigned courses.
- View enrolled students for assigned course sections.
- Create daily attendance.
- Edit previous attendance during the active semester.
- Create quizzes and assignments within approved assessment categories.
- Enter student marks through a spreadsheet-style interface.
- Save marks as draft.
- Submit complete course results to the HOD.
- View returned result submissions and HOD comments.
- Upload course materials.
- View relevant timetable images.
- View relevant examination date sheets.
- Receive in-app notifications.

Teachers will not be allowed to change university-wide grading policies.

## 7.3 Head of Department / Academic Coordinator

The HOD will supervise academic operations within the department.

The HOD will be able to:

- View department dashboard.
- View department students.
- View department teachers.
- View programs and courses within the department.
- Manage semester course offerings.
- Assign one teacher to each course section.
- Review department attendance statistics.
- View students with attendance shortages.
- Review submitted course results.
- Approve complete course results.
- Return course results to teachers with comments.
- Reopen approved results when required.
- View department academic statistics.

The HOD will not manage system-wide settings.

## 7.4 Administrator

The administrator will have the highest level of system access.

The administrator will be able to:

- Create and manage student accounts.
- Create and manage teacher accounts.
- Create HOD accounts.
- Activate or deactivate accounts.
- Reset user passwords.
- Perform student bulk import through CSV or Excel.
- Manage departments.
- Manage academic programs.
- Manage batches.
- Manage semesters.
- Manage sections.
- Manage courses.
- Assign course sets to program, semester, and section.
- Manage teacher assignments.
- Configure grading scales.
- Configure assessment weightages.
- Configure attendance threshold.
- Manage student fee records.
- Upload timetable images.
- Create exam date sheets.
- Publish global announcements.
- View system-wide dashboards.
- Reopen approved results.
- View important audit logs.

---

# 8. Academic Structure

The portal will use the following hierarchy:

**Department → Program → Batch → Semester → Section → Course Offering**

Example:

**Computer Science → BSCS → Fall 2023 Batch → Semester 8 → Section A → Web Engineering**

This academic structure will be used throughout the portal to organize students, teachers, courses, attendance, marks, timetable images, and results.

---

# 9. Department Management

The administrator will create university departments.

Each department may contain one or more academic programs.

Each department will contain information such as:

- Department name
- Department code
- Department description
- Assigned HOD
- Active status

---

# 10. Program Management

Programs will belong to departments.

Program information may include:

- Program name
- Program code
- Department
- Total semesters
- Program duration
- Active status

---

# 11. Batch Management

Students will belong to a batch.

The batch record may include:

- Batch name
- Program
- Starting year
- Expected graduation year
- Active status

---

# 12. Semester Management

The portal will support one active semester at a time.

The administrator will:

- Define the current semester.
- Activate a semester.
- Close the previous semester.
- Preserve previous academic records.

When a semester becomes inactive, its attendance, assessments, marks, results, and course information will remain available as academic history.

---

# 13. Section Management

Students will belong to a specific section.

A section will be associated with:

- Program
- Batch
- Semester
- Section name
- Active status

---

# 14. Student Account Management

Student accounts can be created in two ways.

## 14.1 Manual Account Creation

The administrator can create one student at a time.

Required student information may include:

- Full name
- Registration number
- Gmail address
- Phone number
- Department
- Program
- Batch
- Semester
- Section
- Account status

The student profile will be controlled by the administrator.

## 14.2 Bulk Student Import

The administrator can upload a CSV or Excel file containing multiple students.

The system will:

- Validate registration numbers.
- Validate Gmail addresses.
- Validate department and program references.
- Prevent duplicate registration numbers.
- Prevent duplicate Gmail addresses.
- Import valid records.
- Skip invalid records.
- Display failed row numbers.
- Display the reason each row failed.
- Display total, successful, and failed imports.

---

# 15. Teacher Account Management

Teacher accounts will be created and maintained by the administrator.

Teacher information may include:

- Full name
- Employee ID
- Gmail address
- Phone number
- Department
- Designation
- Account status
- Profile picture

Teachers will be able to view but not edit this information.

---

# 16. Authentication

The system will use secure user authentication.

Students may log in using:

- Registration number, or
- Registered Gmail address

Teachers, HODs, and admins may log in using:

- Employee ID, or
- Registered Gmail address

All accounts will use passwords.

---

# 17. Temporary Password System

When an account is created or reset:

1. The administrator provides a temporary password.
2. The user logs in using the temporary password.
3. The system forces the user to create a new password.
4. Portal access is granted after the password is changed.

---

# 18. Password Recovery

There will be no automatic email-based password recovery in the first version.

If a user forgets their password:

1. The user contacts the administrator.
2. The administrator resets the password.
3. A temporary password is assigned.
4. The user must change the password after login.

---

# 19. Authentication Technology

Authentication will use:

- JWT access tokens
- Refresh tokens
- Secure HTTP-only cookies for refresh tokens
- Short-lived access tokens
- Longer-lived refresh tokens

The system will allow multiple active sessions so that a user can remain logged in on different devices.

---

# 20. Account Status

Every user account will have an account status:

- Active
- Inactive

Inactive users cannot log in.

Only administrators can activate or deactivate accounts.

---

# 21. Role-Based Access Control

The system will use fixed permissions based on four roles:

- Student
- Teacher
- HOD
- Admin

Permissions will not be customizable in the first version.

Backend APIs will verify both authentication and role authorization before processing protected requests.

---

# 22. Course Management

The administrator will create courses.

Each course may contain:

- Course code
- Course title
- Credit hours
- Department
- Program
- Semester
- Description
- Active status

---

# 23. Course Assignment to Students

Students will not select courses themselves.

The administrator will assign a fixed set of courses to:

**Program → Semester → Section**

All active students within that class will automatically receive those courses.

---

# 24. Automatic Enrollment of New Students

If a student is added to a section after courses have already been assigned, the system will automatically enroll the student in all active courses assigned to that section.

Advanced section-transfer handling will not be included in the first version.

---

# 25. Teacher Course Assignment

Each course section will have exactly one assigned teacher.

The HOD or administrator will assign the teacher.

The assigned teacher will manage:

- Attendance
- Assessments
- Marks
- Course materials
- Result submission

---

# 26. Attendance Management

Attendance will be manually recorded by teachers.

The system will not include:

- QR attendance
- Facial recognition
- RFID
- Biometric attendance

---

# 27. Attendance Workflow

The teacher will:

1. Select an assigned course.
2. Select a date.
3. View the list of enrolled students.
4. Mark attendance.
5. Save the attendance record.

Only one attendance session will be allowed per course per date.

---

# 28. Attendance Statuses

Each student may receive one of three statuses:

- Present
- Absent
- Leave

---

# 29. Attendance Editing

Teachers may edit attendance records at any time during the active semester.

Attendance edits will be recorded in the audit history.

---

# 30. Attendance Percentage

Attendance will be calculated using:

**Attendance Percentage = Present Classes / Total Conducted Classes × 100**

Both Absent and Leave will reduce the percentage.

---

# 31. Attendance Threshold

The administrator will configure the minimum required attendance percentage.

The system will not automatically prevent students from sitting exams.

Instead, it will mark students as having an attendance shortage.

---

# 32. Attendance Warnings

Students below the minimum threshold will see:

- A warning on the dashboard.
- A warning indicator beside the affected course.
- Current attendance percentage.
- Required minimum percentage.

Teachers, HODs, and administrators will also be able to identify students with low attendance.

---

# 33. Assessment Structure

The administrator will define a standard university-wide assessment structure.

Example:

| Assessment Category | Weightage |
|---|---:|
| Assignments | 10% |
| Quizzes | 10% |
| Midterm Examination | 30% |
| Final Examination | 50% |
| **Total** | **100%** |

The total configured weightage must equal 100%.

---

# 34. Multiple Quizzes and Assignments

Teachers may create multiple assessments within approved categories.

The system will combine marks within each category and convert them according to the configured category weightage.

---

# 35. Marks Entry Interface

Teachers will enter marks using a spreadsheet-style interface.

The system will validate that numeric marks do not exceed maximum marks.

---

# 36. Special Assessment Statuses

Instead of entering numeric marks, a teacher may select:

- Absent
- Exempted
- Result Withheld

Every student must have either valid marks or one of the approved statuses before the course result can be submitted.

---

# 37. Result Calculation

The system will automatically calculate:

- Assessment category totals
- Weighted marks
- Final percentage
- Letter grade
- Grade point
- Semester GPA
- Cumulative GPA

Teachers will not manually calculate GPA.

---

# 38. Grading Scale

The administrator will define the grading scale.

The final scale will be configured according to university policy.

---

# 39. Result Submission

Teachers may save marks as drafts while entering academic records.

Once all marks are complete:

1. Teacher submits the complete course-section result.
2. Result status becomes **Pending HOD Approval**.
3. Teacher cannot publish the result directly.

---

# 40. HOD Result Approval

HOD approval will be performed at the complete course-section level.

The HOD can:

- Review student marks.
- Review calculated grades.
- Review class statistics.
- Approve the result.
- Return the result to the teacher with comments.

---

# 41. Approved Result Handling

Once approved:

- Results become visible to students.
- The result becomes locked.
- Teachers cannot normally edit it.
- Approval details are stored.

---

# 42. Reopening Results

Approved results may be reopened by:

- HOD
- Administrator

When reopening a result:

- A reason must be provided.
- The action will be recorded in the audit log.
- Previous approval information will remain available.

---

# 43. GPA and CGPA

The system will use course credit hours, grade points, and completed courses to calculate semester GPA and cumulative GPA.

The exact formula will follow the grading policy configured by the administrator.

---

# 44. Result Card

Students will be able to view and download semester-wise result cards.

The result card will contain:

- Student name
- Registration number
- Program
- Semester
- Course code
- Course title
- Credit hours
- Marks
- Letter grade
- Grade point
- Semester GPA

The first version will not generate complete official transcripts.

---

# 45. Fee Management

The fee module will be informational only.

Students will not make payments through the portal.

The administrator will manually update fee information for each student.

---

# 46. Fee Information

The administrator may enter:

- Total semester fee
- Paid amount
- Remaining amount
- Due date
- Payment date
- Optional notes

The system may automatically calculate the remaining amount.

---

# 47. Student Fee View

Students will be able to view:

- Total fee
- Paid amount
- Outstanding amount
- Due date
- Payment status
- Payment history if recorded

Possible statuses:

- Paid
- Partially Paid
- Unpaid
- Overdue

---

# 48. Timetable Module

The timetable system will remain intentionally simple.

There will be no timetable scheduling engine.

The administrator will upload timetable images.

---

# 49. Timetable Assignment

Each timetable image will be assigned to:

- Program
- Semester
- Section

Students will automatically see the timetable image assigned to their class.

Teachers may view timetable images of relevant sections.

---

# 50. Timetable Information

A timetable record may include:

- Title
- Program
- Semester
- Section
- Image file
- Upload date
- Optional description

The administrator can replace the timetable image when the schedule changes.

---

# 51. Examination Date Sheet

The administrator will manually create exam schedules.

The system will not automatically generate exam schedules or detect clashes.

---

# 52. Exam Date Sheet Fields

Each exam entry may include:

- Exam type
- Course
- Program
- Semester
- Section
- Exam date
- Start time
- End time
- Room
- Optional instructions

---

# 53. Student Exam View

Students will see only examinations related to their assigned courses.

Teachers can view examinations related to their course sections.

---

# 54. Course Materials

Teachers can upload course materials for assigned courses.

The system will not include assignment submission.

---

# 55. Supported Course Material Types

Allowed file types will include:

- PDF
- DOCX
- PPTX
- XLSX
- JPG
- JPEG
- PNG

Teachers may also add external resource links.

Executable files will not be allowed.

A maximum upload size will be configured.

---

# 56. Course Material Organization

Course materials will use a simple file list.

Each resource may contain:

- Title
- Description
- File or external link
- Upload date
- Teacher
- Related course

Materials will normally be displayed according to upload date.

---

# 57. Course Material Access

Only students enrolled in the related course will be able to access its materials.

Teachers can manage materials for courses assigned to them.

---

# 58. File Storage

Uploaded files will be stored on the local backend server.

MongoDB will store metadata including:

- Original filename
- Stored filename
- Local file path
- MIME type
- File size
- Upload date
- Uploaded by
- Related course or module

The system will generate unique filenames and validate all file uploads.

---

# 59. Announcements

The system will support global university announcements only.

Announcements will be created by administrators.

There will be no private messaging or targeted departmental announcement system in the first version.

---

# 60. Announcement Fields

Each announcement may include:

- Title
- Description
- Publish date
- Expiry date
- Attachment
- Pinned status
- Active status

All active users may view global announcements.

---

# 61. In-App Notifications

The system will provide in-app notifications.

It will not send SMS or email notifications in the first version.

Notifications may be generated for:

- Result publication
- Attendance changes
- New course materials
- Timetable updates
- New announcements
- Returned results
- Result approval

---

# 62. Notification Features

Users will be able to:

- View notifications
- View unread count
- Mark individual notifications as read
- Mark all notifications as read

---

# 63. Student Dashboard

The student dashboard may display:

- Student information
- Current semester
- Assigned courses
- Attendance percentages
- Attendance shortage warnings
- Recent marks
- GPA
- Fee outstanding amount
- Recent course materials
- Recent announcements
- Notifications
- AI chatbot button

---

# 64. Teacher Dashboard

The teacher dashboard may display:

- Assigned courses
- Assigned sections
- Student counts
- Attendance completion information
- Recent attendance activity
- Pending marks
- Draft results
- Submitted results
- Returned results
- Recent course materials

---

# 65. HOD Dashboard

The HOD dashboard may display:

- Department students
- Department teachers
- Active courses
- Active sections
- Students with attendance shortages
- Pending result approvals
- Recently approved results
- Department academic statistics
- Teacher course assignments

---

# 66. Admin Dashboard

The administrator dashboard may display:

- Total students
- Total teachers
- Departments
- Programs
- Active semester
- Active sections
- Course count
- Fee summary
- Attendance overview
- Recent student imports
- Recent announcements
- Recent audit activity

---

# 67. Search and Filtering

Administrators and HODs will be able to search and filter users.

Student search may support:

- Name
- Registration number
- Gmail address

Student filters may include:

- Department
- Program
- Batch
- Semester
- Section
- Account status

Teacher search may support:

- Name
- Employee ID
- Gmail address

Teacher filters may include:

- Department
- Designation
- Account status

---

# 68. Data Export

The first version will not include CSV or Excel export functionality for academic records.

Information will be viewed within the portal.

---

# 69. Profile Management

Student and teacher profiles will be admin-managed.

Students and teachers can view their information but cannot modify it directly.

---

# 70. Student Academic Status

A student may have an academic status such as:

- Active
- Frozen
- Repeating
- Dropped
- Graduated

The administrator will manage the status manually.

The system will not automatically determine academic status.

---

# 71. Semester Promotion

The administrator will be able to promote students in bulk.

The system may allow the administrator to:

1. Select a program.
2. Select a batch.
3. Select a section.
4. View students.
5. Exclude selected students.
6. Promote remaining students to the next semester.

Exceptional students can be handled manually.

---

# 72. Audit Log

The system will maintain audit logs for important actions only.

Examples include:

- Result approval
- Result rejection
- Result reopening
- Attendance changes
- Account creation
- Bulk import
- Semester promotion
- Fee updates
- Timetable uploads
- Grading scale changes

---

# 73. Audit Log Fields

Each audit record may include:

- User ID
- User role
- Action
- Module
- Affected record
- Previous value where applicable
- Updated value where applicable
- Reason
- Timestamp

---

# 74. Record Deletion

The system will allow permanent deletion where the administrator chooses to remove a record.

Sensitive delete operations should include:

- Confirmation prompt
- Authorization check
- Warning about related data
- Audit logging

The application should use relationship checks to avoid accidental corruption of academic records.

---

# 75. AI Academic Assistant

The portal will include an AI-powered academic chatbot for students.

The chatbot will use the **Google Gemini API**.

The chatbot will be available only to the Student role.

---

# 76. AI Chatbot Purpose

The chatbot will allow students to ask natural-language questions instead of manually navigating through multiple portal pages.

Example questions:

- "What is my attendance in Web Engineering?"
- "How many classes have I missed?"
- "What marks did I get in the midterm?"
- "What is my GPA?"
- "How much fee is remaining?"
- "When is my next exam?"
- "Which teacher teaches Database Systems?"
- "Do I have any attendance shortage?"
- "What course materials are available for Computer Networks?"
- "What is the university's passing percentage?"

---

# 77. AI Chatbot Access

The chatbot will have read-only access to approved information.

It will never be allowed to modify:

- Attendance
- Marks
- Fee information
- Profiles
- Courses
- Notifications
- Results
- University records

---

# 78. Personal Data Available to the Chatbot

The chatbot may retrieve the logged-in student's:

- Attendance
- Assessment marks
- Grades
- GPA and CGPA
- Assigned courses
- Assigned teachers
- Fee status
- Timetable information
- Examination date sheet
- Global announcements
- Course materials

The chatbot will not access:

- Passwords
- Authentication tokens
- Audit logs
- Another student's data

---

# 79. University Knowledge Base for AI

General university information will be prepared by the project developers.

End users will not upload AI documents.

The developers will manually prepare structured university knowledge based on reliable university information.

Knowledge will be stored in MongoDB.

---

# 80. AI Knowledge Record Structure

A knowledge record may contain:

- Title
- Category
- Question
- Information / answer text
- Keywords
- Active status
- Last updated date

Example categories may include:

- Attendance policy
- Examination rules
- Grading policy
- Fee information
- Academic procedures
- General FAQs

There will be no administrator interface for managing AI knowledge in the first version.

The development team will maintain this data directly.

---

# 81. Hybrid AI Routing

The chatbot will use a hybrid intent-routing approach.

## Fixed Backend Routing

Clear student-specific questions will be routed to predefined backend functions.

## University Knowledge Search

General university questions will search structured knowledge stored in MongoDB.

## Gemini Intent Classification

Gemini may be used for:

- Ambiguous questions
- Natural-language interpretation
- Follow-up questions
- Intent classification
- Final response generation

---

# 82. AI Security Model

The Gemini API will not receive unrestricted access to MongoDB.

The flow will be controlled by the application backend.

**Student Question → Backend Authentication → Intent Detection → Approved Data Retrieval → Relevant Context → Gemini API → Response**

The backend decides which information Gemini receives.

---

# 83. AI Hallucination Handling

The chatbot must not invent university information.

If reliable information cannot be found, it will provide a fallback response such as:

> "I could not find this information in your portal records or the available university information. Please contact the university administration for confirmation."

The AI should not guess academic rules, fees, results, or student records.

---

# 84. Chatbot Conversation Context

The chatbot will remember conversation context during the current login session.

The system will understand follow-up questions within the current session.

---

# 85. Chatbot History

Chat history will be temporary.

The chatbot will:

- Remember messages during the active session.
- Clear conversation context after logout or session expiry.
- Not provide permanent conversation history.

---

# 86. Chatbot Interface

The AI assistant will appear as a floating chat widget.

Features may include:

- Chat bubbles
- Suggested questions
- Loading indicator
- Error state
- Clear conversation button
- Minimize button
- Responsive mobile layout

---

# 87. AI API

The system will use the **Google Gemini API**.

The API key will be stored securely in backend environment variables.

The API key must never be exposed in the React frontend.

---

# 88. MERN Technology Stack

## Frontend

- React.js
- React Router
- JavaScript or TypeScript
- HTML5
- CSS3
- Responsive UI framework or utility CSS library

## Backend

- Node.js
- Express.js
- REST API architecture

## Database

- MongoDB
- Mongoose ODM

## Authentication

- JWT access tokens
- Refresh tokens
- HTTP-only cookies
- Password hashing

## AI

- Google Gemini API

---

# 89. Application Architecture

The system will use a three-layer architecture.

## Presentation Layer

React web application used by all four roles.

## Application Layer

Node.js and Express.js backend responsible for:

- Authentication
- Authorization
- Business logic
- Academic operations
- AI orchestration
- File handling
- Notifications

## Data Layer

MongoDB responsible for storing application data.

The Gemini API will act as an external AI service.

---

# 90. Single React Application

The system will use one React application for all roles.

Different role-based routes will be used.

Examples:

- `/student/dashboard`
- `/student/courses`
- `/teacher/dashboard`
- `/teacher/attendance`
- `/hod/results`
- `/admin/students`

---

# 91. Suggested Backend Module Structure

The Express backend may be organized into modules such as:

- Authentication
- Users
- Students
- Teachers
- Departments
- Programs
- Batches
- Semesters
- Sections
- Courses
- Enrollments
- Attendance
- Assessments
- Results
- Fees
- Timetables
- Exams
- Materials
- Announcements
- Notifications
- Audit Logs
- AI Assistant

---

# 92. Suggested MongoDB Collections

Possible MongoDB collections include:

- users
- students
- teachers
- departments
- programs
- batches
- semesters
- sections
- courses
- courseOfferings
- enrollments
- attendanceSessions
- attendanceRecords
- assessmentCategories
- assessments
- marks
- resultSubmissions
- grades
- feeRecords
- timetables
- examSchedules
- courseMaterials
- announcements
- notifications
- auditLogs
- aiKnowledge

The exact schema may be refined during implementation.

---

# 93. Responsive Design

The portal will be responsive.

It should work on:

- Desktop
- Laptop
- Tablet
- Mobile browser

There will be no separate mobile application in the first version.

---

# 94. Deployment Strategy

The project will have two deployment options.

## Online Version

An online deployment will be maintained for demonstration and remote access.

## Local Backup

A fully working local version will also be maintained for the FYP demonstration.

The local version can be used if internet access or hosting fails during presentation.

---

# 95. Local File Storage Requirement

Because files are stored on the backend server, the online deployment must use persistent storage.

Deployment platforms with temporary file systems should not be used for production file storage unless persistent volumes are available.

---

# 96. Security Requirements

The system should include:

- Password hashing
- JWT authentication
- Refresh tokens
- HTTP-only cookies
- Authentication middleware
- Role-based authorization
- Protected API routes
- Input validation
- File upload validation
- File-size restrictions
- MIME-type validation
- Secure API keys
- Environment variables
- Duplicate user prevention
- Restricted AI data access
- Backend validation of user ownership
- Protection against unauthorized academic record access

---

# 97. Data Privacy

Students must only be able to access their own academic information.

Teachers must only access students enrolled in their assigned course sections.

HODs must only access academic information relevant to their department.

Administrators have system-wide access.

The AI chatbot must use the authenticated user's identity rather than trusting student IDs supplied in chat messages.

---

# 98. Input Validation

The backend must validate incoming data.

Examples:

- Required fields
- Valid Gmail format
- Unique registration number
- Unique employee ID
- Valid course references
- Valid semester
- Valid assessment maximum marks
- Marks cannot exceed maximum marks
- Assessment weightage must total 100%
- Valid attendance status
- Valid uploaded file type

---

# 99. Error Handling

The portal should provide clear errors for:

- Invalid login
- Inactive accounts
- Duplicate users
- Unauthorized access
- Invalid file upload
- Missing academic data
- Invalid marks
- Invalid attendance
- AI API failure
- Network errors
- Server errors

Technical server details should not be exposed to normal users.

---

# 100. Performance Requirements

The system should:

- Load dashboards efficiently.
- Use pagination for large student lists.
- Use indexes for commonly searched database fields.
- Avoid loading unnecessary student records.
- Retrieve only required AI context.
- Avoid sending entire database records to Gemini.
- Optimize repeated queries where appropriate.

---

# 101. Usability Requirements

The user interface should be:

- Simple
- Responsive
- Consistent
- Role-specific
- Easy to navigate
- Suitable for non-technical users

Common operations should require minimal steps.

---

# 102. Reliability Requirements

The system should:

- Validate data before saving.
- Prevent duplicate attendance sessions.
- Prevent duplicate registration numbers.
- Prevent duplicate employee IDs.
- Prevent duplicate Gmail accounts.
- Preserve approved academic results.
- Maintain audit logs for important actions.
- Handle Gemini API failures gracefully.

---

# 103. System Limitations

The first version will have several intentional limitations.

These include:

1. Single-campus academic structure.
2. One active semester at a time.
3. No student course selection.
4. No automatic timetable generation.
5. Timetable uploaded as an image only.
6. No timetable conflict detection.
7. No online fee payment.
8. Fee information entered manually.
9. No student complaints or request system.
10. No complete LMS.
11. No assignment submission.
12. No online quizzes.
13. No plagiarism detection.
14. No private messaging.
15. Global announcements only.
16. No email notifications.
17. No SMS notifications.
18. No parent portal.
19. No dedicated mobile app.
20. No full official transcript generation.
21. No complex section-transfer workflow.
22. No automatic academic eligibility decisions.
23. No permanent AI chat history.
24. AI assistant available only to students.
25. AI assistant is read-only.
26. AI knowledge is maintained by developers.
27. No admin AI document upload system.
28. No CSV or Excel export of academic reports.
29. Uploaded files use local server storage.
30. Password reset is handled manually by the administrator.

---

# 104. Future Enhancements

Future versions may add:

- Multi-campus support
- Student course registration
- Elective selection
- Online admissions
- Online fee payments
- Payment gateway integration
- Automatic timetable generation
- Timetable clash detection
- Classroom and room management
- Assignment submission
- Online quizzes
- Plagiarism detection
- Learning Management System features
- Student complaints and request tracking
- Digital document requests
- Official transcripts
- Digital signatures
- Email notifications
- SMS notifications
- Push notifications
- Parent portal
- Library management
- Transport management
- Hostel management
- HR management
- Mobile applications
- QR attendance
- Biometric attendance
- Facial recognition attendance
- Advanced academic analytics
- AI performance analysis
- AI risk detection
- Teacher AI assistant
- HOD AI assistant
- Admin AI assistant
- Permanent AI chat history
- AI document upload interface
- Advanced reporting
- Excel/CSV exports
- Data visualization
- Section-transfer workflows
- Automated promotion rules

---

# 105. Functional Requirements Summary

## Authentication

- User login
- Role-based authorization
- Temporary password
- Mandatory password change
- Admin password reset
- Active/inactive accounts
- Multiple sessions
- JWT and refresh tokens

## Student Management

- Manual student creation
- Bulk import
- Student profiles
- Program assignment
- Batch assignment
- Semester assignment
- Section assignment
- Student status
- Bulk promotion

## Teacher Management

- Teacher account creation
- Department assignment
- Course assignment
- Teacher profiles

## Academic Management

- Departments
- Programs
- Batches
- Semesters
- Sections
- Courses
- Course offerings
- Automatic student course assignment

## Attendance

- Daily manual attendance
- Present
- Absent
- Leave
- Attendance editing
- Attendance percentage
- Attendance threshold
- Shortage warning

## Assessments

- Standard grading structure
- Multiple quizzes
- Multiple assignments
- Midterm
- Final examination
- Marks entry
- Absent status
- Exempted status
- Result withheld status

## Results

- Automatic grade calculation
- GPA calculation
- CGPA calculation
- Teacher result submission
- HOD approval
- HOD return with comments
- Result reopening
- Result card

## Fee Information

- Manual admin entry
- Total fee
- Paid fee
- Remaining fee
- Due date
- Student fee view

## Timetable

- Image upload
- Program assignment
- Semester assignment
- Section assignment
- Student view

## Exams

- Manual exam date sheet
- Student exam view
- Teacher exam view

## Materials

- Course file upload
- External links
- Student download
- Course-based access

## Announcements

- Global announcements
- Pinned announcements
- Expiry dates

## Notifications

- In-app notifications
- Read/unread status

## Dashboards

- Student dashboard
- Teacher dashboard
- HOD dashboard
- Admin dashboard

## AI Assistant

- Gemini API
- Student-only chatbot
- Natural-language queries
- Personal academic information
- General university information
- Hybrid intent routing
- Session context
- Read-only access
- Controlled backend data retrieval
- Hallucination fallback

---

# 106. Non-Functional Requirements

## Security

Only authorized users should access protected information.

## Availability

The portal should be available whenever the server is operational.

## Scalability

The database structure should support increasing numbers of students, courses, and academic records.

## Maintainability

The codebase should follow modular structure and reusable components.

## Usability

The portal should be understandable to users with basic computer knowledge.

## Responsiveness

The interface should work across multiple screen sizes.

## Performance

Most common operations should complete without noticeable delay under normal university use.

## Data Integrity

Academic calculations and references should remain consistent.

## Privacy

Users should only access information permitted by their role.

---

# 107. Main System Workflow

A typical academic workflow will be:

1. Admin creates academic departments and programs.
2. Admin creates batches, semesters, and sections.
3. Admin imports or creates students.
4. Admin creates teachers.
5. Admin creates courses.
6. Courses are assigned to program, semester, and section.
7. Students are automatically enrolled in assigned courses.
8. HOD or admin assigns teachers to course sections.
9. Teachers record attendance.
10. Teachers create quizzes and assignments.
11. Teachers enter marks.
12. The system calculates weighted marks.
13. Teachers submit course results.
14. HOD reviews results.
15. HOD approves results.
16. Students view published results.
17. GPA is calculated.
18. Students download result cards.
19. Admin updates fee information.
20. Admin uploads timetable images and exam date sheets.
21. Teachers upload course materials.
22. Admin publishes announcements.
23. Students use the AI assistant to retrieve academic information.

---

# 108. Example AI Workflow

A student asks:

> "What is my attendance in Computer Networks?"

The workflow will be:

1. Student is authenticated.
2. Chatbot receives the question.
3. Backend detects an attendance-related intent.
4. Backend obtains the logged-in student's ID from the authenticated session.
5. Backend retrieves Computer Networks attendance.
6. Backend prepares relevant context.
7. Context and question are sent to Gemini.
8. Gemini generates a natural-language response.
9. Response is shown inside the floating chatbot.

---

# 109. Example University Knowledge AI Workflow

A student asks:

> "What percentage is required to pass a course?"

The workflow will be:

1. Backend classifies the question as general university information.
2. Relevant structured knowledge records are searched in MongoDB.
3. Matching university information is retrieved.
4. Relevant text is sent to Gemini.
5. Gemini generates the final answer.
6. If no reliable record exists, the chatbot tells the student that the information is unavailable.

---

# 110. Expected Benefits

The proposed portal is expected to provide several benefits:

- Centralized student academic information
- Reduced manual record management
- Faster access to attendance and marks
- Better result approval workflow
- Easier course and teacher management
- Improved academic transparency
- Simple attendance shortage monitoring
- Better access to study materials
- Easier distribution of announcements
- Modern student self-service experience
- Practical use of generative AI
- Reduced repetitive academic inquiries
- Improved administrative efficiency

---

# 111. Expected Deliverables

The final FYP should include:

1. Responsive React frontend
2. Node.js and Express backend
3. MongoDB database
4. REST APIs
5. Authentication system
6. Student module
7. Teacher module
8. HOD module
9. Admin module
10. Attendance module
11. Assessment module
12. Results module
13. GPA calculation
14. Fee information module
15. Timetable image module
16. Exam date sheet module
17. Course materials module
18. Announcement module
19. Notification module
20. Audit logging
21. AI chatbot using Gemini API
22. Developer-managed AI knowledge base
23. Online deployment
24. Local demonstration setup
25. FYP documentation
26. Database design
27. API documentation
28. Test cases

---

# 112. Success Criteria

The project will be considered successful if:

- All four user roles can securely access their permitted features.
- Students are automatically assigned fixed courses.
- Teachers can successfully manage attendance.
- Teachers can enter and submit marks.
- HODs can review and approve results.
- GPA calculations are correct.
- Students can access published results.
- Fee information can be viewed.
- Timetable images work according to section.
- Course materials can be uploaded and accessed.
- Global announcements are displayed.
- Notifications work correctly.
- The AI chatbot answers supported student questions.
- The AI chatbot cannot access unauthorized student data.
- The system works on mobile and desktop.
- Important academic actions are logged.
- The system can be demonstrated online and locally.

---

# 113. Conclusion

The **University Portal with AI Academic Assistant** will provide a centralized system for managing important university academic activities while giving students convenient access to their academic information.

The project focuses on realistic and practical features rather than attempting to build a complete university ERP. The selected scope is suitable for a Final Year Project because it combines full-stack web development, database design, authentication, role-based authorization, academic workflows, file handling, data processing, dashboards, and generative artificial intelligence.

The MERN stack will provide the foundation of the application, while the Google Gemini API will power the student academic assistant.

The result will be a modern, responsive, and extensible university portal that demonstrates both conventional software engineering and practical AI integration.
