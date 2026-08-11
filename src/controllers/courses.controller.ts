import {
  assignCoursesToSection,
  assignTeacherToOffering,
  createCourse,
  deleteCourse,
  getSectionCourseOfferings,
  listAssignableTeachers,
  listCourses,
  listCourseOfferings,
  listStudentCourses,
  listTeacherCourseOfferings,
  updateCourse,
} from '../services/course.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  courseOfferingParamsSchema,
  courseParamsSchema,
  createCourseSchema,
  sectionCourseAssignmentSchema,
  sectionCourseParamsSchema,
  teacherAssignmentSchema,
  updateCourseSchema,
} from '../validators/course.validator.js'

export const listCoursesController = asyncHandler(async (req, res) => {
  const courses = await listCourses(req.auth!.user)

  res.status(200).json({ courses })
})

export const listAssignableTeachersController = asyncHandler(async (req, res) => {
  const teachers = await listAssignableTeachers(req.auth!.user)

  res.status(200).json({ teachers })
})

export const listCourseOfferingsController = asyncHandler(async (req, res) => {
  const offerings = await listCourseOfferings(req.auth!.user)

  res.status(200).json({ offerings })
})

export const createCourseController = asyncHandler(async (req, res) => {
  const payload = createCourseSchema.parse(req.body)
  const course = await createCourse(payload)

  res.status(201).json({
    message: 'Course created',
    course,
  })
})

export const updateCourseController = asyncHandler(async (req, res) => {
  const { courseId } = courseParamsSchema.parse(req.params)
  const payload = updateCourseSchema.parse(req.body)
  const course = await updateCourse(courseId, payload)

  res.status(200).json({
    message: 'Course updated',
    course,
  })
})

export const deleteCourseController = asyncHandler(async (req, res) => {
  const { courseId } = courseParamsSchema.parse(req.params)
  await deleteCourse(courseId)

  res.status(200).json({ message: 'Course deleted' })
})

export const assignCoursesToSectionController = asyncHandler(async (req, res) => {
  const { sectionId } = sectionCourseParamsSchema.parse(req.params)
  const payload = sectionCourseAssignmentSchema.parse(req.body)
  const offerings = await assignCoursesToSection(sectionId, payload)

  res.status(200).json({
    message: 'Section courses saved',
    offerings,
  })
})

export const getSectionCourseOfferingsController = asyncHandler(async (req, res) => {
  const { sectionId } = sectionCourseParamsSchema.parse(req.params)
  const offerings = await getSectionCourseOfferings(sectionId, req.auth!.user)

  res.status(200).json({ offerings })
})

export const assignTeacherToOfferingController = asyncHandler(async (req, res) => {
  const { offeringId } = courseOfferingParamsSchema.parse(req.params)
  const payload = teacherAssignmentSchema.parse(req.body)
  const offering = await assignTeacherToOffering(offeringId, payload, req.auth!.user)

  res.status(200).json({
    message: 'Course teacher saved',
    offering,
  })
})

export const listStudentCoursesController = asyncHandler(async (req, res) => {
  const offerings = await listStudentCourses(req.auth!.user)

  res.status(200).json({ offerings })
})

export const listTeacherCourseOfferingsController = asyncHandler(async (req, res) => {
  const offerings = await listTeacherCourseOfferings(req.auth!.user)

  res.status(200).json({ offerings })
})
