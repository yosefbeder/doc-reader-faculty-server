import { Request, Response } from "express"
import { TQueryParameters } from "../../types"
import { LectureType, UserRole } from "@prisma/client" 

import { moduleSchema, subjectSchema } from "../../schema"
import { badRequest, conflict, notFound, send, unauthorized } from "../../utlis/responses"
import { currentDate, extractErrors, parameterExists } from "../../utlis/helpers"

import Module from "../models/Module"
import db, { findSubjectMany, findSubjectUnique } from "../../utlis/db"
import AuthController from "./AuthController"

export default class ModuleController {

  async get(req: Request, res: Response) {

    try {
      const yearId = parameterExists(req, res, "yearId")
      if (!yearId) return badRequest(res, "Invalid yearId")
  
      const { search, orderBy, orderType }: TQueryParameters = req.query as any
      
      const modules = await db.module.findMany({
        where: { 
          yearId,
          name: { contains: search }
        },
        include: { _count: { select: { subjects: true } } },
        orderBy: { [orderBy]: orderType }
      })
  
      return res.status(200).json({
        data: modules,
        message: "Modules data",
        status: 200
      })
    } catch (errorObject) {
      return res.status(500).json({
        errorObject,
        message: "Error - Something Went Wrong.",
        status: 500
      })
    }

  }

  async createModule(req: Request, res: Response) {

    try {
      const yearId = parameterExists(req, res, "yearId")
      if (!yearId) return badRequest(res, "Invalid yearId")
  
      const parsedBody = moduleSchema.create.safeParse(req.body)
      if (!parsedBody.success) return send(res, "Validation errors", 400, extractErrors(parsedBody))
      
      const user = await AuthController.user(req, res)
      if (!user || user.role !== UserRole.Admin) return unauthorized(res, "Unauthorized cannot create a module.")
      
      const findModule = await db.module.findFirst({
        where: { yearId, name: parsedBody.data.name, semesterName: parsedBody.data.semesterName }
      })
      if (findModule) return conflict(res, "Module already exists.")
      
      const newModule = await db.module.create({
        data: {
          yearId,
          ...parsedBody.data,
          createdAt: currentDate()
        }
      })
      return send(res, "Module has been created", 201, newModule)
    } catch (errorObject) {
      return res.status(500).json({
        errorObject,
        message: "Error - Something Went Wrong.",
        status: 500
      })
    }

  }
  
  async createSubject(req: Request, res: Response) {

    try {
      const user = await AuthController.user(req, res)
      if (!user || user.role !== UserRole.Admin) return unauthorized(res, "Unauthorized cannot create a subject.")
      
      const moduleId = parameterExists(req, res, "moduleId")
      if (!moduleId) return notFound(res, "Invalid moduleId")
  
      const module = await db.module.findUnique({ where: { id: moduleId }, select: { id: true } })
      if (!module) return notFound(res, "Module not found.")
  
      const parsedBody = subjectSchema.create.safeParse(req.body)
      if (!parsedBody.success) return send(res, "Validation errors", 400, extractErrors(parsedBody))
  
      const findSubject = await db.subject.findFirst({
        where: { moduleId, name: parsedBody.data.name }
      })
      if (findSubject) return conflict(res, "Subject already exists.")
      
      const { id: subjectId } = await db.subject.create({
        data: {
          moduleId,
          ...parsedBody.data,
          createdAt: currentDate()
        }
      })
      const newSubject = (await findSubjectUnique("id", subjectId))!;

      await db.lecture.create({
        data: {
          title: "Practical Data",
          subTitle: "Practical Data Description",
          subjectId: newSubject.id,
          type: LectureType.Practical,
          date: currentDate(),
          createdAt: currentDate()
        }
      })
      await db.lecture.create({
        data: {
          title: "Final Revision Data",
          subTitle: "Final Revision Data Description",
          subjectId: newSubject.id,
          type: LectureType.FinalRevision,
          date: currentDate(),
          createdAt: currentDate()
        }
      })

      return send(res, "Subject has been created", 201, newSubject)
    } catch (errorObject) {
      return res.status(500).json({
        errorObject,
        message: "Error - Something Went Wrong.",
        status: 500
      })
    }

  }

  async getModule(req: Request, res: Response) {
    try {
      const yearId = parameterExists(req, res, "yearId")
      const moduleId = parameterExists(req, res, "moduleId")
  
      if (!yearId) return badRequest(res, "Invalid yearId")
      if (!moduleId) return badRequest(res, "Invalid Module Id")
      
      const module = await Module.find(moduleId)
      if (!module) return notFound(res, "Module doesn't exist.")
     
      return send(res, "Module", 200, module)
    } catch (errorObject) {
      return res.status(500).json({
        errorObject,
        message: "Error - Something Went Wrong.",
        status: 500
      })
    }
  }

  async getModuleSubjects(req: Request, res: Response) {

    try {
      const yearId = parameterExists(req, res, "yearId")
      const moduleId = parameterExists(req, res, "moduleId")
  
      if (!yearId) return badRequest(res, "Invalid yearId")
      if (!moduleId) return badRequest(res, "Invalid moduleId")
  
      const module = await Module.find(moduleId)
      if (!module) return notFound(res, "Module doesn't exist.")
  
      const subjects = await findSubjectMany("moduleId", moduleId)
      return send(res, "Module subjects", 200, subjects)
    } catch (errorObject) {
      return res.status(500).json({
        errorObject,
        message: "Error - Something Went Wrong.",
        status: 500
      })
    }

  }

  async updateModule(req: Request, res: Response) {

    try {
      const user = await AuthController.user(req, res)
      if (!user || user.role !== UserRole.Admin) return unauthorized(res, "Unauthorized cannot update a module.")

      const yearId = parameterExists(req, res, "yearId")
      const moduleId = parameterExists(req, res, "moduleId")
  
      if (!yearId) return badRequest(res, "Invalid yearId")
      if (!moduleId) return badRequest(res, "Invalid moduleId")
  
      const module = await Module.find(moduleId)
      if (!module) return notFound(res, "Module doesn't exist.")
     
      const parsedBody = moduleSchema.update.safeParse(req.body)
      if (!parsedBody.success) return send(res, "Validation errors", 400, extractErrors(parsedBody))
  
      const findModule = await db.module.findFirst({
        where: { 
          yearId, 
          name: parsedBody.data.name,
          semesterName: parsedBody.data.semesterName,
          AND: [
            { id: { not: moduleId } }
          ]
        }
      })
      if (findModule) return conflict(res, "Module already exists.")
      
      const updatedModule = await db.module.update({
        where: { id: moduleId },
        data: parsedBody.data
      })
      return send(res, "Module has been updated", 200, updatedModule)
    } catch (errorObject) {
      return res.status(500).json({
        errorObject,
        message: "Error - Something Went Wrong.",
        status: 500
      })
    }

  }

  async deleteModule(req: Request, res: Response) {
    try {
      const user = await AuthController.user(req, res)
      if (!user || user.role !== UserRole.Admin) return unauthorized(res, "Unauthorized cannot delete a module.")
      
      const yearId = parameterExists(req, res, "yearId")
      const moduleId = parameterExists(req, res, "moduleId")

      if (!yearId) return badRequest(res, "Invalid yearId")
      if (!moduleId) return badRequest(res, "Invalid moduleId")
      
      const module = await Module.find(moduleId)
      if (!module) return notFound(res, "Module doesn't exist.")
  
      const deletedModule = await db.module.delete({ where: { id: moduleId } })
      return send(res, "Module has been deleted", 200, deletedModule) 
    } catch (errorObject) {
      return res.status(500).json({
        errorObject,
        message: "Error - Something Went Wrong.",
        status: 500
      })
    }
  }
 
}