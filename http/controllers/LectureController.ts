import { Request, Response } from "express"
import { UserRole } from "@prisma/client"

import { linkSchema, subjectLecture } from "../../schema"
import { badRequest, notFound, send, unauthorized, validationErrors } from "../../utlis/responses"
import { currentDate, extractErrors, parameterExists } from "../../utlis/helpers"

import db from "../../utlis/db"
import AuthController from "./AuthController"

export default class LectureController {
  
  async get(req: Request, res: Response) {
    try {
      const user = await AuthController.user(req, res)
      const lectureId = parameterExists(req, res, "lectureId")
      if (!lectureId) return badRequest(res, "Invalid lectureId")
      
      const lecture = await db.lectureData.findUnique({ 
        where: { id: lectureId },
        include: { subject: true } 
      })
      if (!lecture) return notFound(res, "Lecture doesn't exist.")
      
      const module = await db.module.findUnique({ where: { id: lecture?.subject.moduleId } })
     
      if (user?.yearId !== module?.yearId) return unauthorized(res, "Unauthorized")
     
      return send(res, `lectureId [${lectureId}] - Data`, 200, lecture)
    } catch (errorObject) {
      return res.status(500).json({
        errorObject,
        message: "Error - Something Went Wrong.",
        status: 500
      })
    }
    
  }
  
  async updateLecture(req: Request, res: Response) {
    try {
      const user = await AuthController.user(req, res)
      if (!user || user.role !== UserRole.Admin) return unauthorized(res, "Unauthorized cannot update a lecture.")

      const lectureId = parameterExists(req, res, "lectureId")
      if (!lectureId) return badRequest(res, "Invalid lectureId")
      
      const lecture = await db.lectureData.findUnique({ 
        where: { id: lectureId },
        include: { subject: true } 
      })
      if (!lecture) return notFound(res, "Lecture doesn't exist.")
      
      const module = await db.module.findUnique({ where: { id: lecture?.subject.moduleId } })
    
      if (user?.yearId !== module?.yearId) return unauthorized(res, "Unauthorized")
    
      const body = subjectLecture.update.safeParse(req.body)
      if (!body.success) return validationErrors(res, extractErrors(body))

      const data = body.data
      const updatedLecture = await db.lectureData.update({
        where: { id: lectureId },
        data
      })
      return send(res, "Lecture has been updated", 200, updatedLecture)
    } catch (errorObject) {
      return res.status(500).json({
        errorObject,
        message: "Error - Something Went Wrong.",
        status: 500
      })
    }
    
  }

  async deleteLecture(req: Request, res: Response) {
    try {
      const user = await AuthController.user(req, res)
      if (!user || user.role !== UserRole.Admin) return unauthorized(res, "Unauthorized cannot delete a lecture.")

      const lectureId = parameterExists(req, res, "lectureId")
      if (!lectureId) return badRequest(res, "Invalid lectureId")
      
      const lecture = await db.lectureData.findUnique({ 
        where: { id: lectureId },
        include: { subject: true } 
      })
      if (!lecture) return notFound(res, "Lecture doesn't exist.")
      
      const module = await db.module.findUnique({ where: { id: lecture?.subject.moduleId } })
     
      if (user?.yearId !== module?.yearId) return unauthorized(res, "Unauthorized")
  
      const deletedLecture = await db.lectureData.delete({
        where: { id: lectureId }
      })
      return send(res, "Lecture has been deleted", 200, deletedLecture)
    } catch (errorObject) {
      return res.status(500).json({
        errorObject,
        message: "Error - Something Went Wrong.",
        status: 500
      })
    }
  }

  async getLinks(req: Request, res: Response) {

    try {
      const user = await AuthController.user(req, res)
      const lectureId = parameterExists(req, res, "lectureId")
      if (!lectureId) return badRequest(res, "Invalid lectureId")
      
      const lecture = await db.lectureData.findUnique({ 
        where: { id: lectureId },
        include: { subject: true } 
      })
      if (!lecture) return notFound(res, "Lecture doesn't exist.")
      
      const module = await db.module.findUnique({ where: { id: lecture?.subject.moduleId } })
     
      if (user?.yearId !== module?.yearId) return unauthorized(res, "Unauthorized")
     
      const links = await db.lectureLinks.findMany({
        where: { lectureId: lecture.id }
      })
  
      return send(res, `lectureId [${lectureId}] - Links`, 200, links)
    } catch (errorObject) {
      return res.status(500).json({
        errorObject,
        message: "Error - Something Went Wrong.",
        status: 500
      })
    }
  }
    
  async createLink(req: Request, res: Response) {
    try {
      const user = await AuthController.user(req, res)
      if (!user || user.role !== UserRole.Admin) return unauthorized(res, "Unauthorized cannot create a link.")

      const lectureId = parameterExists(req, res, "lectureId")
      if (!lectureId) return badRequest(res, "Invalid lectureId")
      
      const lecture = await db.lectureData.findUnique({ 
        where: { id: lectureId },
        include: { subject: true } 
      })
      if (!lecture) return notFound(res, "Lecture doesn't exist.")
      
      const module = await db.module.findUnique({ where: { id: lecture?.subject.moduleId } })
      if (user?.yearId !== module?.yearId) return unauthorized(res, "Unauthorized")
    
      const body = linkSchema.create.safeParse(req.body)
      if (!body.success) return validationErrors(res, extractErrors(body))

      const data = body.data
      const createdLink = await db.lectureLinks.create({
        data: {
          ...data,
          lectureId: lecture.id,
          createdAt: currentDate()
        }
      })
      return send(res, "Lecture Link has been created", 201, createdLink)
    } catch (errorObject) {
      return res.status(500).json({
        errorObject,
        message: "Error - Something Went Wrong.",
        status: 500
      })
    }
  }
    
  async updateLink(req: Request, res: Response) {
    try {
      const user = await AuthController.user(req, res)
      if (!user || user.role !== UserRole.Admin) return unauthorized(res, "Unauthorized cannot update a link.")

      const lectureId = parameterExists(req, res, "lectureId")
      const linkId = parameterExists(req, res, "linkId")
  
      if (!lectureId) return badRequest(res, "Invalid lectureId")
      if (!linkId) return badRequest(res, "Invalid linkId")
      
      const lecture = await db.lectureData.findUnique({ 
        where: { id: lectureId },
        include: { subject: true } 
      })
      const link = await db.lectureLinks.findUnique({ where: { id: linkId } })
  
      if (!lecture) return notFound(res, "Lecture doesn't exist.")
      if (!link) return notFound(res, "Link doesn't exist.")
      
      const module = await db.module.findUnique({ where: { id: lecture?.subject.moduleId } })
      if (user?.yearId !== module?.yearId) return unauthorized(res, "Unauthorized")
     
      const body = linkSchema.update.safeParse(req.body)
      if (!body.success) return validationErrors(res, extractErrors(body))
  
      const data = body.data
      const createdLink = await db.lectureLinks.update({
        where: { id: link.id },
        data: {
          ...data,
          
        }
      })
      return send(res, "Link has been updated", 200, createdLink)
    } catch (errorObject) {
      return res.status(500).json({
        errorObject,
        message: "Error - Something Went Wrong.",
        status: 500
      })
    }
  
  }

  async deleteLink(req: Request, res: Response) {
    try {
      const user = await AuthController.user(req, res)
      if (!user || user.role !== UserRole.Admin) return unauthorized(res, "Unauthorized cannot delete a link.")

      const lectureId = parameterExists(req, res, "lectureId")
      const linkId = parameterExists(req, res, "linkId")
  
      if (!lectureId) return badRequest(res, "Invalid lectureId")
      if (!linkId) return badRequest(res, "Invalid linkId")
      
      const lecture = await db.lectureData.findUnique({ 
        where: { id: lectureId },
        include: { subject: true } 
      })
      const link = await db.lectureLinks.findUnique({ where: { id: linkId } })
  
      if (!lecture) return notFound(res, "Lecture doesn't exist.")
      if (!link) return notFound(res, "Link doesn't exist.")
      
      const module = await db.module.findUnique({ where: { id: lecture?.subject.moduleId } })
      if (user?.yearId !== module?.yearId) return unauthorized(res, "Unauthorized")
     
      const deletedLink = await db.lectureLinks.delete({
        where: { id: link.id }
      })
      return send(res, "Link has been deleted", 200, deletedLink)
    } catch (errorObject) {
      return res.status(500).json({
        errorObject,
        message: "Error - Something Went Wrong.",
        status: 500
      })
    }
  }
  
}