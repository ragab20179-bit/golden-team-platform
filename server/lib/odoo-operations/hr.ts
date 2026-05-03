import { z } from "zod";
import type { Operation } from "./types";

// ── CREATE_EMPLOYEE ───────────────────────────────────────────────────────────
const createEmployeeSchema = z.object({
  name: z.string().min(1),
  jobTitle: z.string().optional(),
  workEmail: z.string().email().optional(),
  workPhone: z.string().optional(),
  departmentId: z.number().optional(),
  managerId: z.number().optional(),
});

export const createEmployee: Operation<typeof createEmployeeSchema> = {
  name: "CREATE_EMPLOYEE",
  description: "Create a new employee record in Odoo HR",
  examples: [
    "create employee Ahmed Al-Rashidi, IT Manager",
    "add new employee Sara Mohammed in HR department",
    "register employee Khalid Al-Mansouri, work email k.mansouri@company.com",
  ],
  schema: createEmployeeSchema,
  execute: async (f, ctx) => {
    const id = await ctx.odooCreate("hr.employee", {
      name: f.name,
      ...(f.jobTitle     ? { job_title: f.jobTitle }         : {}),
      ...(f.workEmail    ? { work_email: f.workEmail }        : {}),
      ...(f.workPhone    ? { work_phone: f.workPhone }        : {}),
      ...(f.departmentId ? { department_id: f.departmentId } : {}),
      ...(f.managerId    ? { parent_id: f.managerId }         : {}),
    });
    await ctx.auditSuccess(id, String(f.name));
    return { success: true, id, message: `Employee "${f.name}" created in Odoo (ID: ${id})` };
  },
};

// ── CREATE_LEAVE_REQUEST ──────────────────────────────────────────────────────
const createLeaveSchema = z.object({
  employeeId: z.number(),
  leaveTypeId: z.number(),
  dateFrom: z.string(),
  dateTo: z.string(),
  name: z.string().optional(),
});

export const createLeaveRequest: Operation<typeof createLeaveSchema> = {
  name: "CREATE_LEAVE_REQUEST",
  description: "Create a leave/time-off request for an employee",
  examples: [
    "create leave request for employee 5 from 2026-06-01 to 2026-06-05",
    "request annual leave for Ahmed from June 1 to June 5",
    "add sick leave for employee 12 for tomorrow",
  ],
  schema: createLeaveSchema,
  execute: async (f, ctx) => {
    const id = await ctx.odooCreate("hr.leave", {
      employee_id: f.employeeId,
      holiday_status_id: f.leaveTypeId,
      date_from: f.dateFrom,
      date_to: f.dateTo,
      name: f.name ?? "Leave Request",
    });
    await ctx.auditSuccess(id, `Leave for Employee #${f.employeeId}`);
    return { success: true, id, message: `Leave request created for employee ${f.employeeId} (ID: ${id})` };
  },
};
