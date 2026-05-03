import { z } from "zod";
import type { Operation } from "./types";

// ── CREATE_PROJECT ────────────────────────────────────────────────────────────
const createProjectSchema = z.object({
  name: z.string().min(1),
  partnerId: z.number().optional(),
  description: z.string().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
});

export const createProject: Operation<typeof createProjectSchema> = {
  name: "CREATE_PROJECT",
  description: "Create a new project in Odoo",
  examples: [
    "create project KDP Phase 2",
    "add new project for Gulf Ventures IT rollout",
    "create Odoo project: Nadheem Green Riyadh",
  ],
  schema: createProjectSchema,
  execute: async (f, ctx) => {
    const id = await ctx.odooCreate("project.project", {
      name: f.name,
      ...(f.partnerId   ? { partner_id: f.partnerId }     : {}),
      ...(f.description ? { description: f.description }  : {}),
      ...(f.dateStart   ? { date_start: f.dateStart }     : {}),
      ...(f.dateEnd     ? { date: f.dateEnd }              : {}),
    });
    await ctx.auditSuccess(id, String(f.name));
    return { success: true, id, message: `Project "${f.name}" created (ID: ${id})` };
  },
};

// ── CREATE_TASK ───────────────────────────────────────────────────────────────
const createTaskSchema = z.object({
  name: z.string().min(1),
  projectId: z.number(),
  assignedUserId: z.number().optional(),
  deadline: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(["0", "1"]).default("0"),
});

export const createTask: Operation<typeof createTaskSchema> = {
  name: "CREATE_TASK",
  description: "Create a task inside an existing Odoo project",
  examples: [
    "create task 'Review RFQ' in project 5",
    "add task for user 3 in project 8: prepare site report",
    "create high-priority task in KDP project",
  ],
  schema: createTaskSchema,
  execute: async (f, ctx) => {
    const id = await ctx.odooCreate("project.task", {
      name: f.name,
      project_id: f.projectId,
      priority: f.priority,
      ...(f.assignedUserId ? { user_ids: [[6, 0, [f.assignedUserId]]] } : {}),
      ...(f.deadline       ? { date_deadline: f.deadline }               : {}),
      ...(f.description    ? { description: f.description }              : {}),
    });
    await ctx.auditSuccess(id, String(f.name));
    return { success: true, id, message: `Task "${f.name}" created in project ${f.projectId} (ID: ${id})` };
  },
};
