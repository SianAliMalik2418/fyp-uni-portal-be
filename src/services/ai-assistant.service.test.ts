import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../utils/api-error.js'
import { GEMINI_ASSISTANT_MODEL } from './ai.service.js'
import {
  AI_READ_ONLY_REFUSAL,
  AI_UNKNOWN_INFORMATION_FALLBACK,
  createAiAssistantService,
  type AiAssistantDependencies,
  type GeminiAssistantRequest,
} from './ai-assistant.service.js'

const studentContext = {
  identity: {
    name: 'Student One',
    email: 'student@example.com',
    registrationNumber: 'BSCS-001',
  },
  academic_structure: {
    currentSemester: { id: 'semester-1', name: 'Fall', academicYear: '2026' },
    program: { id: 'program-1', name: 'BS Computer Science', code: 'BSCS' },
    semester: { id: 'semester-1', name: 'Fall', academicYear: '2026' },
    section: { id: 'section-1', name: 'A' },
  },
  courses: [
    {
      id: 'offering-1',
      course: { id: 'course-1', code: 'CS401', title: 'Software Engineering', creditHours: 3 },
      teacher: { id: 'teacher-1', fullName: 'Teacher One', email: 'teacher@example.com' },
    },
  ],
  attendance: [
    {
      offering: { id: 'offering-1', course: { code: 'CS401', title: 'Software Engineering' } },
      totalClasses: 10,
      present: 8,
      absent: 2,
      leave: 0,
      attendancePercentage: 80,
      requiredPercentage: 75,
      isBelowThreshold: false,
    },
  ],
  marks: {
    recentMarks: [],
    summary: {
      publishedAssessments: 2,
      coursesWithMarks: 1,
      averagePercentage: 78,
      weightedPercentage: 31.2,
    },
  },
  grades: [
    {
      course: { id: 'course-1', code: 'CS401', title: 'Software Engineering' },
      finalPercentage: 78,
      letterGrade: 'B+',
      gradePoint: 3.3,
    },
  ],
  gpa: {
    semesters: [{ semester: { id: 'semester-1', name: 'Fall', academicYear: '2026' }, gpa: 3.2 }],
    cgpa: 3.1,
  },
  results: { semesters: [], cgpa: 3.1 },
  fee: {
    totalAmount: 100000,
    paidAmount: 95000,
    remainingAmount: 5000,
    dueDate: '2026-09-15',
    status: 'partially_paid',
  },
  timetable: {
    entries: [
      {
        id: 'entry-1',
        dayOfWeek: 'monday',
        startTime: '09:00',
        endTime: '10:00',
        room: 'R-1',
        courseOffering: { course: { code: 'CS401', title: 'Software Engineering' } },
      },
    ],
  },
  exams: [
    {
      id: 'exam-1',
      examType: 'Final',
      course: { code: 'CS401', title: 'Software Engineering' },
      examDate: '2026-12-10',
      startTime: '09:00',
      endTime: '12:00',
      room: 'Hall A',
    },
  ],
  announcements: [
    {
      id: 'announcement-1',
      title: 'Registration open',
      description: 'Registration closes on 2026-08-30.',
      publishDate: new Date('2026-08-24T00:00:00.000Z'),
      isPinned: true,
      isActive: true,
    },
  ],
}

function createDependencies(response: object): {
  dependencies: AiAssistantDependencies
  getRequest: () => GeminiAssistantRequest | undefined
} {
  let request: GeminiAssistantRequest | undefined
  return {
    dependencies: {
      getStudentContext: vi.fn().mockResolvedValue(studentContext),
      searchKnowledge: vi.fn().mockResolvedValue([
        {
          key: 'configured-attendance-requirement',
          title: 'Configured attendance requirement',
          category: 'attendance_rules',
          information: 'The configured minimum attendance requirement is 75%.',
          keywords: ['attendance'],
          source: 'configuration',
        },
      ]),
      generate: vi.fn().mockImplementation(async (input) => {
        request = input
        return JSON.stringify(response)
      }),
    },
    getRequest: () => request,
  }
}

describe('AI assistant service', () => {
  it('uses the supported stable Gemini model', () => {
    expect(GEMINI_ASSISTANT_MODEL).toBe('gemini-3.6-flash')
  })

  it('rejects non-student users before reading context or calling Gemini', async () => {
    const { dependencies } = createDependencies({})

    await expect(
      createAiAssistantService(dependencies).ask({ id: 'teacher-1', role: 'teacher' } as never, {
        message: 'Show student attendance.',
        conversation: [],
      })
    ).rejects.toEqual(new ApiError(403, 'Student AI assistant access required'))
    expect(dependencies.getStudentContext).not.toHaveBeenCalled()
    expect(dependencies.generate).not.toHaveBeenCalled()
  })

  it('grounds a student answer without exposing database IDs to Gemini', async () => {
    const { dependencies, getRequest } = createDependencies({
      answer: 'Your CGPA is 3.1.',
      grounded: true,
      knowledgeKeys: [],
      contextSections: ['gpa'],
    })
    const service = createAiAssistantService(dependencies)

    const answer = await service.ask({ id: 'student-1', role: 'student' } as never, {
      message: 'What is my CGPA?',
      conversation: [
        { role: 'user', content: 'How are my results?' },
        { role: 'assistant', content: 'Which result would you like to review?' },
      ],
    })

    expect(answer).toEqual({
      answer: 'Your CGPA is 3.1.',
      grounded: true,
      knowledgeKeys: [],
      contextSections: ['gpa'],
    })
    expect(JSON.stringify(getRequest()?.grounding)).not.toContain('student-1')
    expect(JSON.stringify(getRequest()?.grounding)).not.toContain('offering-1')
    expect(JSON.stringify(getRequest()?.grounding)).not.toContain('student@example.com')
    expect(JSON.stringify(getRequest()?.grounding)).not.toContain('remainingAmount')
    expect(getRequest()?.grounding).toEqual({
      studentContext: {
        gpa: {
          semesters: [{ semester: { name: 'Fall', academicYear: '2026' }, gpa: 3.2 }],
          cgpa: 3.1,
        },
      },
      trustedKnowledge: [
        {
          key: 'configured-attendance-requirement',
          title: 'Configured attendance requirement',
          category: 'attendance_rules',
          information: 'The configured minimum attendance requirement is 75%.',
          source: 'configuration',
        },
      ],
    })
    expect(getRequest()?.messages).toEqual([
      { role: 'user', content: 'How are my results?' },
      { role: 'assistant', content: 'Which result would you like to review?' },
      { role: 'user', content: 'What is my CGPA?' },
    ])
  })

  it('answers a policy question without reading or sending student records', async () => {
    const { dependencies, getRequest } = createDependencies({
      answer: 'The configured grading scale uses grade points up to 4.',
      grounded: true,
      knowledgeKeys: ['configured-grading-scale'],
      contextSections: [],
    })
    vi.mocked(dependencies.searchKnowledge).mockResolvedValue([
      {
        key: 'configured-grading-scale',
        title: 'Configured grading scale',
        category: 'grading_policy',
        information: 'The configured grading scale uses grade points up to 4.',
        keywords: ['grading'],
        source: 'configuration',
      },
    ])

    const answer = await createAiAssistantService(dependencies).ask(
      { id: 'student-1', role: 'student' } as never,
      { message: 'What is the configured grading scale?', conversation: [] }
    )

    expect(answer.grounded).toBe(true)
    expect(dependencies.getStudentContext).not.toHaveBeenCalled()
    expect(getRequest()?.grounding).toEqual({
      studentContext: {},
      trustedKnowledge: [
        {
          key: 'configured-grading-scale',
          title: 'Configured grading scale',
          category: 'grading_policy',
          information: 'The configured grading scale uses grade points up to 4.',
          source: 'configuration',
        },
      ],
    })
  })

  it('does not treat policy wording about my university as a personal-record question', async () => {
    const { dependencies } = createDependencies({
      answer: 'The configured attendance requirement is 75%.',
      grounded: true,
      knowledgeKeys: ['configured-attendance-requirement'],
      contextSections: [],
    })

    const answer = await createAiAssistantService(dependencies).ask(
      { id: 'student-1', role: 'student' } as never,
      { message: "What is my university's attendance requirement?", conversation: [] }
    )

    expect(answer.grounded).toBe(true)
    expect(dependencies.getStudentContext).not.toHaveBeenCalled()
  })

  it('sends only the identity field needed by the question', async () => {
    const { dependencies, getRequest } = createDependencies({
      answer: 'Your name is Student One.',
      grounded: true,
      knowledgeKeys: [],
      contextSections: ['identity'],
    })

    const answer = await createAiAssistantService(dependencies).ask(
      { id: 'student-1', role: 'student' } as never,
      { message: 'What is my name?', conversation: [] }
    )

    expect(answer.grounded).toBe(true)
    expect(getRequest()?.grounding).toEqual({
      studentContext: { identity: { name: 'Student One' } },
      trustedKnowledge: [
        {
          key: 'configured-attendance-requirement',
          title: 'Configured attendance requirement',
          category: 'attendance_rules',
          information: 'The configured minimum attendance requirement is 75%.',
          source: 'configuration',
        },
      ],
    })
  })

  it('uses the nearest relevant user turn for a referential follow-up', async () => {
    const { dependencies, getRequest } = createDependencies({
      answer: 'Your GPA for Fall is 3.2.',
      grounded: true,
      knowledgeKeys: [],
      contextSections: ['gpa'],
    })

    const answer = await createAiAssistantService(dependencies).ask(
      { id: 'student-1', role: 'student' } as never,
      {
        message: 'What about this term?',
        conversation: [
          { role: 'user', content: 'What is my GPA?' },
          { role: 'assistant', content: 'Your CGPA is 3.1.' },
        ],
      }
    )

    expect(answer.grounded).toBe(true)
    expect(getRequest()?.grounding).toEqual(
      expect.objectContaining({
        studentContext: {
          gpa: {
            semesters: [{ semester: { name: 'Fall', academicYear: '2026' }, gpa: 3.2 }],
            cgpa: 3.1,
          },
        },
      })
    )
  })

  it('refuses write requests without calling Gemini', async () => {
    const { dependencies } = createDependencies({})
    const service = createAiAssistantService(dependencies)

    const answer = await service.ask({ id: 'student-1', role: 'student' } as never, {
      message: 'Change my attendance to present',
      conversation: [],
    })

    expect(answer).toEqual({
      answer: AI_READ_ONLY_REFUSAL,
      grounded: true,
      knowledgeKeys: [],
      contextSections: [],
    })
    expect(dependencies.generate).not.toHaveBeenCalled()
    expect(dependencies.getStudentContext).not.toHaveBeenCalled()
  })

  it('uses a fixed fallback when Gemini reports insufficient grounding', async () => {
    const { dependencies } = createDependencies({
      answer: 'I am unsure.',
      grounded: false,
      knowledgeKeys: [],
      contextSections: [],
    })

    const answer = await createAiAssistantService(dependencies).ask(
      { id: 'student-1', role: 'student' } as never,
      { message: 'Where is the north campus shuttle?', conversation: [] }
    )

    expect(answer.answer).toBe(AI_UNKNOWN_INFORMATION_FALLBACK)
    expect(answer.grounded).toBe(false)
  })

  it('maps provider failures to a stable service-unavailable response', async () => {
    const { dependencies } = createDependencies({})
    vi.mocked(dependencies.generate).mockRejectedValue(new Error('provider credential rejected'))

    await expect(
      createAiAssistantService(dependencies).ask({ id: 'student-1', role: 'student' } as never, {
        message: 'What is my CGPA?',
        conversation: [],
      })
    ).rejects.toEqual(new ApiError(502, 'AI assistant provider is unavailable'))
  })

  it('rejects numeric academic claims absent from trusted grounding', async () => {
    const { dependencies } = createDependencies({
      answer: 'Your CGPA is 4.0.',
      grounded: true,
      knowledgeKeys: [],
      contextSections: ['gpa'],
    })
    vi.mocked(dependencies.searchKnowledge).mockResolvedValue([
      {
        key: 'configured-grading-scale',
        title: 'Configured grading scale',
        category: 'grading_policy',
        information: 'A: 85-100% (4 grade points)',
        keywords: ['grading'],
        source: 'configuration',
      },
    ])

    const answer = await createAiAssistantService(dependencies).ask(
      { id: 'student-1', role: 'student' } as never,
      { message: 'What is my CGPA?', conversation: [] }
    )

    expect(answer).toEqual({
      answer: AI_UNKNOWN_INFORMATION_FALLBACK,
      grounded: false,
      knowledgeKeys: [],
      contextSections: [],
    })
  })

  it('turns malformed Gemini output into a controlled upstream error', async () => {
    const { dependencies } = createDependencies({})
    vi.mocked(dependencies.generate).mockResolvedValue('not-json')

    await expect(
      createAiAssistantService(dependencies).ask({ id: 'student-1', role: 'student' } as never, {
        message: 'What is my attendance?',
        conversation: [],
      })
    ).rejects.toEqual(new ApiError(502, 'AI assistant returned an invalid response'))
  })
})
