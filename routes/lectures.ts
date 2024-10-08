import LectureController from "../http/controllers/LectureController"

import { checkIsAuthenticated } from "../middlewares/isAuthenticated"
import { Router } from "express"

const lecturesRouter = Router()
const lectureController = new LectureController()

lecturesRouter.use(checkIsAuthenticated)

lecturesRouter.get('/lectures/:lectureId', lectureController.get)
lecturesRouter.post('/lectures/:lectureId/update', lectureController.updateLecture)
lecturesRouter.delete('/lectures/:lectureId/delete', lectureController.deleteLecture)

lecturesRouter.get('/lectures/:lectureId/links', lectureController.getLinks)
lecturesRouter.post('/lectures/:lectureId/links/create', lectureController.createLink)

lecturesRouter.get('/links/:linkId', lectureController.getLink)
lecturesRouter.post('/links/:linkId/update', lectureController.updateLink)
lecturesRouter.delete('/links/:linkId/delete', lectureController.deleteLink)

export default lecturesRouter