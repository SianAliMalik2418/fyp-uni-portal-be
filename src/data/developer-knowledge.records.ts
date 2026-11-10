import type { DeveloperKnowledgeInput } from '../services/knowledge-base.service.js'

/**
 * Trusted answers the student assistant may use. Numbers that administrators can change (the
 * attendance minimum, assessment weights, the grading scale and the passing threshold) are
 * deliberately not repeated here: the assistant reads them live from the configuration, so a
 * record that copied them could contradict the portal.
 */
export const developerKnowledgeRecords = [
  // ---------------------------------------------------------------- attendance_rules
  {
    knowledgeKey: 'attendance-how-recorded',
    title: 'How attendance is recorded',
    category: 'attendance_rules',
    question: 'How is my attendance recorded?',
    information:
      'Your course teacher records attendance for each class session and marks every student present, absent or on leave. The portal calculates your attendance percentage for each course from the saved sessions. Students cannot edit attendance. If you believe a session was recorded wrongly, speak to the course teacher.',
    keywords: ['attendance', 'recorded', 'present', 'absent', 'teacher', 'session', 'percentage'],
    isActive: true,
  },
  {
    knowledgeKey: 'attendance-percentage-calculation',
    title: 'How the attendance percentage is calculated',
    category: 'attendance_rules',
    question: 'How is my attendance percentage calculated?',
    information:
      'Attendance percentage for a course is the number of classes you attended divided by the total number of classes held so far, multiplied by 100. For example, attending 8 of 10 classes gives 80 percent. Each course has its own percentage, and your Attendance page shows all of them.',
    keywords: ['attendance', 'percentage', 'calculate', 'calculation', 'classes', 'formula'],
    isActive: true,
  },
  {
    knowledgeKey: 'attendance-leave-policy',
    title: 'Leave and attendance',
    category: 'attendance_rules',
    question: 'What happens when I take leave?',
    information:
      'A class marked as leave is recorded separately from an absence, so it is visible to your teacher and your department head. Leave still counts as a class that was held, so frequent leave can lower your attendance percentage. Inform your course teacher in advance whenever possible.',
    keywords: ['leave', 'absence', 'absent', 'attendance', 'excuse', 'medical'],
    isActive: true,
  },
  {
    knowledgeKey: 'attendance-shortage-consequences',
    title: 'Attendance shortage',
    category: 'attendance_rules',
    question: 'What happens if my attendance is below the minimum?',
    information:
      'If your attendance in a course falls below the minimum requirement, the portal shows a shortage warning on your Attendance page and sends you a notification. Your department head also sees the shortage list. Students with a shortage should meet the course teacher before the final examination to discuss their position.',
    keywords: ['attendance', 'shortage', 'below', 'warning', 'minimum', 'short', 'consequence'],
    isActive: true,
  },
  {
    knowledgeKey: 'attendance-improve-tips',
    title: 'Improving a low attendance percentage',
    category: 'attendance_rules',
    question: 'How can I improve my attendance?',
    information:
      'Attendance can only grow by attending upcoming classes, because past sessions are fixed. Check your Attendance page for the courses that are below the requirement, attend every remaining class in those courses, and speak to the teacher early if you have a genuine reason for missed classes.',
    keywords: ['improve', 'attendance', 'low', 'increase', 'better', 'raise'],
    isActive: true,
  },
  // ---------------------------------------------------------------- grading_policy
  {
    knowledgeKey: 'gpa-calculation',
    title: 'How GPA is calculated',
    category: 'grading_policy',
    question: 'How is my GPA calculated?',
    information:
      'GPA is credit-hour weighted. Multiply each course grade point by its credit hours, add these up, and divide by the total credit hours of the term. For example, a 3.0 grade point in a 3 credit-hour course and a 4.0 in a 1 credit-hour course give (3.0 x 3 + 4.0 x 1) / 4 = 3.25. Your GPA is shown for each term that has approved results.',
    keywords: ['gpa', 'calculate', 'calculation', 'credit', 'hours', 'grade point', 'formula'],
    isActive: true,
  },
  {
    knowledgeKey: 'cgpa-calculation',
    title: 'How CGPA is calculated',
    category: 'grading_policy',
    question: 'What is CGPA and how is it calculated?',
    information:
      'CGPA is your cumulative grade point average. It uses the same credit-hour weighted formula as GPA but across all of your approved results from every term, not just one. A CGPA of 0 means you have no approved results yet.',
    keywords: ['cgpa', 'cumulative', 'overall', 'average', 'calculate', 'gpa'],
    isActive: true,
  },
  {
    knowledgeKey: 'gpa-vs-cgpa',
    title: 'Difference between GPA and CGPA',
    category: 'grading_policy',
    question: 'What is the difference between GPA and CGPA?',
    information:
      'GPA covers a single term, for example Spring 2026. CGPA covers every term with approved results. Your GPA can go up or down each term, and your CGPA moves more slowly because it averages all terms together.',
    keywords: ['gpa', 'cgpa', 'difference', 'term', 'semester', 'cumulative'],
    isActive: true,
  },
  {
    knowledgeKey: 'grade-points-meaning',
    title: 'Letter grades and grade points',
    category: 'grading_policy',
    question: 'What are grade points?',
    information:
      'Each letter grade has a grade point value that is used to calculate GPA and CGPA. Your final percentage in a course is converted to a letter grade and grade point using the grading scale. The full scale is shown under the configured grading scale.',
    keywords: ['grade', 'point', 'letter', 'grade points', 'scale', 'meaning'],
    isActive: true,
  },
  {
    knowledgeKey: 'final-percentage-calculation',
    title: 'How the final course percentage is calculated',
    category: 'grading_policy',
    question: 'How is my final percentage in a course calculated?',
    information:
      'Your marks in each assessment category (such as quizzes, assignments, midterm and final) are converted to a percentage, multiplied by the weight of that category, and added together to give your final percentage. The category weights are shown under the configured assessment structure.',
    keywords: [
      'final',
      'percentage',
      'course',
      'weight',
      'weighted',
      'marks',
      'calculate',
      'total',
    ],
    isActive: true,
  },
  {
    knowledgeKey: 'marks-visibility',
    title: 'Where to see my marks',
    category: 'grading_policy',
    question: 'Where can I see my marks?',
    information:
      'Recent assessment marks appear on your Dashboard. Marks that teachers have published are shown against each assessment with the maximum marks. Your course result becomes official only after your department head approves it, and you can then see it on the Results page.',
    keywords: ['marks', 'see', 'view', 'where', 'assessment', 'quiz', 'assignment', 'dashboard'],
    isActive: true,
  },
  {
    knowledgeKey: 'marks-special-statuses',
    title: 'Absent, exempted and withheld marks',
    category: 'grading_policy',
    question: 'What does absent, exempted or result withheld mean on my marks?',
    information:
      'A mark can carry a status instead of a number. Absent means you did not attend that assessment. Exempted means the assessment does not count for you. Result withheld means your result is being held back until an issue is resolved. Contact your course teacher or department head for the reason.',
    keywords: ['absent', 'exempted', 'withheld', 'status', 'marks', 'result withheld'],
    isActive: true,
  },
  // ---------------------------------------------------------------- passing_rules
  {
    knowledgeKey: 'passing-grade-meaning',
    title: 'What counts as passing a course',
    category: 'passing_rules',
    question: 'What do I need to pass a course?',
    information:
      'A course is passed when your final percentage reaches the passing threshold and earns a grade point above zero. An F grade has a grade point of 0 and means the course was not passed. The exact threshold is shown under the configured passing threshold.',
    keywords: ['pass', 'passing', 'fail', 'failing', 'course', 'threshold', 'f grade'],
    isActive: true,
  },
  {
    knowledgeKey: 'failed-course-repeat',
    title: 'What to do after failing a course',
    category: 'passing_rules',
    question: 'What happens if I fail a course?',
    information:
      'A course with an F grade has to be repeated. Speak to your department head about registering the course again in a later term. The new result is recorded as a separate result for that term, and the portal includes approved results in your CGPA.',
    keywords: ['fail', 'failed', 'repeat', 'retake', 'f grade', 'course', 'again'],
    isActive: true,
  },
  {
    knowledgeKey: 'result-recheck-request',
    title: 'Asking for a recheck of a result',
    category: 'passing_rules',
    question: 'Can I ask for my result to be rechecked?',
    information:
      'If you think a mark or grade is wrong, first speak to the course teacher. If it is not resolved, ask your department head, who can send a submitted result back to the teacher for correction before it is approved, or reopen an approved result with a recorded reason. Rechecks are handled by the department, not by the student portal.',
    keywords: ['recheck', 'review', 'wrong', 'mistake', 'dispute', 'result', 'appeal', 'reopen'],
    isActive: true,
  },
  // ---------------------------------------------------------------- examination_rules
  {
    knowledgeKey: 'exam-where-to-find-schedule',
    title: 'Finding my exam schedule',
    category: 'examination_rules',
    question: 'Where can I find my exam date sheet?',
    information:
      'Open the Exams page. It lists every exam for the courses you are enrolled in, with the date, start and end time, room and instructions. The administration schedules exams for each course, so the page updates as soon as a date or room changes.',
    keywords: ['exam', 'exams', 'date sheet', 'datesheet', 'schedule', 'where', 'find', 'room'],
    isActive: true,
  },
  {
    knowledgeKey: 'exam-fall-2026-dates',
    title: 'Fall 2026 midterm and final exam dates',
    category: 'examination_rules',
    question: 'When are the final exams and the midterm exams?',
    information:
      'Fall 2026 midterm examinations were held from 26 to 30 October 2026. Final examinations begin on 4 January 2027. The university is closed from 25 December 2026 to 1 January 2027 for the winter break. Your own paper dates and rooms are on the Exams page.',
    keywords: [
      'exam',
      'exams',
      'midterm',
      'final',
      'finals',
      'final exams',
      'exam dates',
      'fall 2026',
      'january',
      'october',
      'dates',
      'when',
      'start',
    ],
    isActive: true,
  },
  {
    knowledgeKey: 'exam-what-to-bring',
    title: 'What to bring to an exam',
    category: 'examination_rules',
    question: 'What should I bring to an exam?',
    information:
      'Bring your university ID card and the stationery you need. Mobile phones are not allowed in the examination hall. Calculators are allowed only when the exam instructions say so. Arrive at least 30 minutes before the paper starts.',
    keywords: ['bring', 'exam', 'id card', 'stationery', 'calculator', 'phone', 'hall', 'allowed'],
    isActive: true,
  },
  {
    knowledgeKey: 'exam-attendance-eligibility',
    title: 'Attendance and sitting the final exam',
    category: 'examination_rules',
    question: 'Can I sit the final exam if my attendance is short?',
    information:
      'Students need to meet the minimum attendance requirement to appear in the final examination. If your attendance in a course is below the requirement, speak to the course teacher and your department head before the exam period starts. The current requirement is shown on your Attendance page.',
    keywords: [
      'final',
      'exam',
      'attendance',
      'eligible',
      'eligibility',
      'allowed',
      'short',
      'appear',
    ],
    isActive: true,
  },
  {
    knowledgeKey: 'exam-clash-or-error',
    title: 'Reporting an exam clash or wrong detail',
    category: 'examination_rules',
    question: 'What if two exams clash or the room is wrong?',
    information:
      'Contact the Registrar Office, which manages the exam schedule. Tell them the course name, your section and what looks wrong. Do not wait until exam day, because schedule changes take effect on the Exams page as soon as the administration saves them.',
    keywords: ['exam', 'clash', 'conflict', 'wrong', 'room', 'error', 'report', 'registrar'],
    isActive: true,
  },
  {
    knowledgeKey: 'exam-midterm-vs-final',
    title: 'Midterm and final examinations',
    category: 'examination_rules',
    question: 'What is the difference between the midterm and the final?',
    information:
      'The midterm is held partway through the term and the final at the end. Both are weighted assessment categories in your course result, and the final usually carries the larger weight. The exact weights are shown under the configured assessment structure.',
    keywords: ['midterm', 'final', 'difference', 'exam', 'weight', 'term'],
    isActive: true,
  },
  // ---------------------------------------------------------------- academic_procedures
  {
    knowledgeKey: 'result-publication-process',
    title: 'How results are published',
    category: 'academic_procedures',
    question: 'How do my results get published?',
    information:
      'The course teacher enters marks and submits the result. The department head reviews it and either approves it or returns it to the teacher with a comment. Only approved results are published to students, and you receive a notification when yours is approved. Until then the result does not appear on the Results page.',
    keywords: [
      'result',
      'results',
      'publish',
      'published',
      'approved',
      'approval',
      'hod',
      'when',
      'process',
    ],
    isActive: true,
  },
  {
    knowledgeKey: 'result-not-visible',
    title: 'Why I cannot see my result yet',
    category: 'academic_procedures',
    question: 'Why can I not see my result?',
    information:
      'A result stays hidden until the teacher has submitted it and the department head has approved it. If it was returned, the teacher is correcting it. This protects students from seeing results that are not final. If your result is still missing after the expected date, ask the course teacher whether it has been submitted.',
    keywords: ['result', 'not showing', 'missing', 'cannot see', 'not visible', 'pending', 'where'],
    isActive: true,
  },
  {
    knowledgeKey: 'result-card',
    title: 'Viewing and downloading the result card',
    category: 'academic_procedures',
    question: 'How do I get my result card?',
    information:
      'Open the Results page, choose the term, and select View result card. The card shows your name, registration number, program, each course with its marks, grade and credit hours, and your GPA. You can download it from the same dialog.',
    keywords: ['result card', 'transcript', 'download', 'print', 'results', 'card', 'pdf'],
    isActive: true,
  },
  {
    knowledgeKey: 'course-enrollment-process',
    title: 'How course enrollment works',
    category: 'academic_procedures',
    question: 'How am I enrolled in courses?',
    information:
      'The administration assigns courses to your section for each term, and that creates your enrollment in every course of the section automatically. You do not register course by course. Your enrolled courses, teachers and rooms are on the Courses page. If a course is missing, contact the Registrar Office.',
    keywords: [
      'enroll',
      'enrollment',
      'register',
      'registration',
      'courses',
      'course',
      'missing',
      'add',
    ],
    isActive: true,
  },
  {
    knowledgeKey: 'course-add-drop',
    title: 'Adding or dropping a course',
    category: 'academic_procedures',
    question: 'Can I add or drop a course?',
    information:
      'Course changes are made by the administration, not in the student portal. Speak to your department head first, and then the Registrar Office will update your enrollment. The portal is read-only for students, and the AI assistant cannot change enrollment either.',
    keywords: ['add', 'drop', 'withdraw', 'course', 'change', 'enrollment', 'switch'],
    isActive: true,
  },
  {
    knowledgeKey: 'timetable-where',
    title: 'Finding my class timetable',
    category: 'academic_procedures',
    question: 'Where is my timetable?',
    information:
      'Open the Timetable page to see your weekly class schedule for your section, with each course, day, time, room, teacher and slot type such as lecture or lab. Only the published timetable is visible, so changes appear after the administration publishes a new version.',
    keywords: ['timetable', 'schedule', 'classes', 'weekly', 'room', 'time', 'where', 'class'],
    isActive: true,
  },
  {
    knowledgeKey: 'timetable-change',
    title: 'Timetable changes',
    category: 'academic_procedures',
    question: 'What if my timetable changes?',
    information:
      'The administration prepares timetable drafts and publishes them when they are final. You will not see a draft. When a new version is published, the Timetable page shows it straight away. Check the Announcements page for notices about changes.',
    keywords: ['timetable', 'change', 'update', 'published', 'draft', 'new'],
    isActive: true,
  },
  {
    knowledgeKey: 'announcements-where',
    title: 'Where university announcements appear',
    category: 'academic_procedures',
    question: 'Where do I find announcements?',
    information:
      'Open the Announcements page. Pinned announcements are at the top, and some have a PDF attachment you can open. Important events also create a notification under the bell icon in the header.',
    keywords: ['announcement', 'announcements', 'notice', 'notices', 'news', 'pinned', 'pdf'],
    isActive: true,
  },
  {
    knowledgeKey: 'notifications-explained',
    title: 'What notifications tell me',
    category: 'academic_procedures',
    question: 'What are notifications?',
    information:
      'Notifications are alerts sent to you about events such as courses being assigned, attendance falling below the requirement, and results being published. Open the bell icon in the header to read them, and use Mark all as read to clear the unread count.',
    keywords: ['notification', 'notifications', 'alert', 'bell', 'unread', 'mark as read'],
    isActive: true,
  },
  {
    knowledgeKey: 'account-first-login',
    title: 'Signing in for the first time',
    category: 'academic_procedures',
    question: 'How do I sign in for the first time?',
    information:
      'Accounts are created by the administration. Sign in with your email and the temporary password you were given. You will be asked to choose a new password before you can use the portal. If you forgot your password, ask the Registrar Office to reset it, and they will give you a new temporary password.',
    keywords: [
      'login',
      'sign in',
      'password',
      'forgot',
      'reset',
      'first time',
      'temporary',
      'account',
    ],
    isActive: true,
  },
  {
    knowledgeKey: 'account-profile-change',
    title: 'Changing my personal details',
    category: 'academic_procedures',
    question: 'How do I change my name or email?',
    information:
      'Personal and academic details are managed by the administration to keep records accurate. Contact the Registrar Office with the correction and any supporting document. Students cannot edit these details in the portal, and the AI assistant cannot change them either.',
    keywords: ['change', 'name', 'email', 'profile', 'details', 'correct', 'update', 'phone'],
    isActive: true,
  },
  {
    knowledgeKey: 'semester-promotion',
    title: 'Moving to the next semester',
    category: 'academic_procedures',
    question: 'How do I move to the next semester?',
    information:
      'The administration promotes students from their current section to a section in the next term in one step, with the option to exclude individual students such as those repeating courses. You do not apply for promotion yourself. Your Courses page updates after the promotion.',
    keywords: ['promotion', 'promote', 'next semester', 'move', 'semester', 'upgrade', 'section'],
    isActive: true,
  },
  {
    knowledgeKey: 'who-to-contact',
    title: 'Who to contact for what',
    category: 'academic_procedures',
    question: 'Who should I contact about a problem?',
    information:
      'For marks, attendance or a course, contact the course teacher first. For results, approvals and attendance shortages, contact your department head. For accounts, passwords, enrollment, fees, timetable and exam schedules, contact the Registrar Office.',
    keywords: [
      'contact',
      'who',
      'help',
      'problem',
      'support',
      'teacher',
      'hod',
      'registrar',
      'office',
    ],
    isActive: true,
  },
  {
    knowledgeKey: 'assistant-what-it-does',
    title: 'What the AI assistant can and cannot do',
    category: 'academic_procedures',
    question: 'What can the AI assistant do?',
    information:
      'The assistant answers questions about your own attendance, marks, grades, CGPA, results, courses, timetable, exams, fees and announcements, and explains university policies. It only reads your records and cannot change anything, such as attendance or marks. It does not see other students.',
    keywords: ['assistant', 'ai', 'chatbot', 'help', 'what can', 'cannot', 'read-only', 'bot'],
    isActive: true,
  },
  // ---------------------------------------------------------------- fee_faqs
  {
    knowledgeKey: 'fee-where-to-check',
    title: 'Checking my fee status',
    category: 'fee_faqs',
    question: 'Where can I see my fee status?',
    information:
      'Open the Fees page. It shows your total fee, the amount paid, the remaining amount, the due date, your payment status and any notes from the administration. The values are read-only for students and are maintained by the administration.',
    keywords: ['fee', 'fees', 'status', 'balance', 'remaining', 'paid', 'due', 'check', 'where'],
    isActive: true,
  },
  {
    knowledgeKey: 'fee-installments',
    title: 'Paying fees in installments',
    category: 'fee_faqs',
    question: 'Can I pay my fee in installments?',
    information:
      'Yes. The administration can record partial payments, so your fee can show an amount paid and an amount remaining at the same time. Each payment is added to your record, and the remaining amount updates automatically. Ask the Registrar Office to set up an installment plan if you need one.',
    keywords: ['installment', 'installments', 'partial', 'pay', 'payment', 'plan', 'fee'],
    isActive: true,
  },
  {
    knowledgeKey: 'fee-due-date-fall-2026',
    title: 'Fall 2026 fee due date',
    category: 'fee_faqs',
    question: 'When is the Fall 2026 fee due?',
    information:
      'The first installment of the Fall 2026 fee was due on 15 October 2026. Students with outstanding dues may not be allowed to register for the final term. Check the Fees page for your own due date and remaining amount.',
    keywords: ['fee', 'due', 'deadline', 'fall 2026', 'october', 'last date', 'when'],
    isActive: true,
  },
  {
    knowledgeKey: 'fee-overdue-consequence',
    title: 'What happens when a fee is overdue',
    category: 'fee_faqs',
    question: 'What if I miss the fee deadline?',
    information:
      'An unpaid amount after the due date remains on your fee record as remaining. Students with outstanding dues may not be allowed to register for the final term. Contact the Registrar Office as early as possible to arrange payment or an installment plan.',
    keywords: ['fee', 'overdue', 'late', 'miss', 'deadline', 'unpaid', 'dues', 'penalty'],
    isActive: true,
  },
  {
    knowledgeKey: 'fee-payment-not-showing',
    title: 'My payment is not showing',
    category: 'fee_faqs',
    question: 'I paid my fee but it is not showing. What should I do?',
    information:
      'Payments appear after the administration records them, so there can be a short delay. Keep your payment receipt and contact the Registrar Office with it if the Fees page still does not show the payment after a couple of working days.',
    keywords: ['payment', 'not showing', 'paid', 'receipt', 'fee', 'missing', 'update', 'recorded'],
    isActive: true,
  },
  {
    knowledgeKey: 'fee-scholarships',
    title: 'Scholarship applications',
    category: 'fee_faqs',
    question: 'How do I apply for a scholarship?',
    information:
      'Merit and need-based scholarship applications for Spring 2027 are open until 30 November 2026. Watch the Announcements page for the application details, and contact the Registrar Office for the application form and the documents required.',
    keywords: [
      'scholarship',
      'scholarships',
      'financial aid',
      'merit',
      'need-based',
      'apply',
      'funding',
    ],
    isActive: true,
  },
  // ---------------------------------------------------------------- general_university_faqs
  {
    knowledgeKey: 'university-programs-offered',
    title: 'Programs offered',
    category: 'general_university_faqs',
    question: 'What programs does the university offer?',
    information:
      'The university offers BS Software Engineering, BS Artificial Intelligence, BS Data Science, BS Electrical Engineering, BS Accounting and Finance, BS Mathematics, BS Physics and the Bachelor of Business Administration. At postgraduate level it offers MS Software Engineering and the Master of Business Administration.',
    keywords: [
      'programs',
      'program',
      'degrees',
      'offered',
      'bs',
      'ms',
      'mba',
      'bba',
      'courses offered',
    ],
    isActive: true,
  },
  {
    knowledgeKey: 'university-departments',
    title: 'Departments',
    category: 'general_university_faqs',
    question: 'What departments are there?',
    information:
      'There are six departments: Software Engineering, Artificial Intelligence, Electrical Engineering, Management Sciences, Mathematics and Physics. Each department has a head of department and its own faculty, programs, batches and courses.',
    keywords: ['departments', 'department', 'faculty', 'schools', 'hod', 'head of department'],
    isActive: true,
  },
  {
    knowledgeKey: 'university-program-duration',
    title: 'Program duration',
    category: 'general_university_faqs',
    question: 'How long is a degree program?',
    information:
      'The bachelor programs run for 4 years, which is 8 semesters. The master programs, MS Software Engineering and the MBA, run for 2 years, which is 4 semesters.',
    keywords: ['duration', 'years', 'semesters', 'long', 'length', 'degree', 'bs', 'ms', 'mba'],
    isActive: true,
  },
  {
    knowledgeKey: 'university-terms-calendar',
    title: 'Academic terms',
    category: 'general_university_faqs',
    question: 'When does the semester start and end?',
    information:
      'Fall 2026 runs from 1 September 2026 to 15 January 2027. Spring 2027 runs from 1 February 2027 to 15 June 2027. Your Courses and Timetable pages always show the current term.',
    keywords: ['semester', 'term', 'start', 'end', 'calendar', 'fall', 'spring', 'dates', 'when'],
    isActive: true,
  },
  {
    knowledgeKey: 'university-winter-break',
    title: 'Winter break',
    category: 'general_university_faqs',
    question: 'When is the winter break?',
    information:
      'The university is closed from 25 December 2026 to 1 January 2027. Final examinations resume on 4 January 2027.',
    keywords: ['winter', 'break', 'holiday', 'holidays', 'closed', 'vacation', 'december'],
    isActive: true,
  },
  {
    knowledgeKey: 'university-career-services',
    title: 'Career services',
    category: 'general_university_faqs',
    question: 'Does the university offer career help?',
    information:
      'The Career Services Office runs CV clinics and mock interviews. The next career counselling week is from 16 to 20 November 2026 in the Student Centre. Announcements carry the details.',
    keywords: ['career', 'jobs', 'cv', 'interview', 'counselling', 'internship', 'placement'],
    isActive: true,
  },
  {
    knowledgeKey: 'university-library-hours',
    title: 'Library hours',
    category: 'general_university_faqs',
    question: 'What are the library hours?',
    information:
      'The central library stays open until 10 pm during the examination period. Regular opening hours are shown at the library desk and in announcements.',
    keywords: ['library', 'hours', 'open', 'timing', 'study', 'books'],
    isActive: true,
  },
  {
    knowledgeKey: 'university-fyp-showcase',
    title: 'Final year project showcase',
    category: 'general_university_faqs',
    question: 'When is the final year project showcase?',
    information:
      'Final-year students present their projects on 12 December 2026. Supervisors will share the schedule, and announcements will carry updates.',
    keywords: [
      'fyp',
      'final year project',
      'showcase',
      'presentation',
      'project',
      'december',
      'supervisor',
    ],
    isActive: true,
  },
] satisfies readonly DeveloperKnowledgeInput[]
