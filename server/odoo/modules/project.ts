/**
 * server/odoo/modules/project.ts
 *
 * Project domain — projects and tasks.
 */

import { odooSearchRead, odooCreate } from "../helpers";
import type { Project, ProjectTask } from "../types";

const PROJECT_FIELDS = [
  "name", "partner_id", "date_start", "date",
  "user_id", "task_count", "description", "privacy_visibility",
  "last_update_status", "tag_ids",
];

const TASK_FIELDS = [
  "name", "project_id", "user_ids", "stage_id",
  "date_deadline", "date_assign", "priority",
  "description", "tag_ids", "kanban_state",
];

export async function getProjects(limit = 50): Promise<Project[]> {
  return odooSearchRead<Project>("project.project", [], PROJECT_FIELDS, {
    limit,
    order: "name asc",
  });
}

export async function getProjectTasks(projectId?: number, limit = 100): Promise<ProjectTask[]> {
  const domain = projectId ? [["project_id", "=", projectId]] : [];
  return odooSearchRead<ProjectTask>("project.task", domain, TASK_FIELDS, {
    limit,
    order: "priority desc, date_deadline asc",
  });
}

export interface CreateProjectInput {
  name: string;
  partnerId?: number;
  dateStart?: string;
  dateEnd?: string;
  description?: string;
}

export async function createProject(input: CreateProjectInput): Promise<number> {
  const values: Record<string, unknown> = { name: input.name };
  if (input.partnerId !== undefined) values.partner_id = input.partnerId;
  if (input.dateStart !== undefined) values.date_start = input.dateStart;
  if (input.dateEnd !== undefined) values.date = input.dateEnd;
  if (input.description !== undefined) values.description = input.description;
  return odooCreate("project.project", values);
}

export interface CreateTaskInput {
  name: string;
  projectId: number;
  description?: string;
  dateDeadline?: string;
  userIds?: number[];
  priority?: "0" | "1";
}

export async function createTask(input: CreateTaskInput): Promise<number> {
  const values: Record<string, unknown> = {
    name: input.name,
    project_id: input.projectId,
  };
  if (input.description !== undefined) values.description = input.description;
  if (input.dateDeadline !== undefined) values.date_deadline = input.dateDeadline;
  if (input.userIds !== undefined && input.userIds.length > 0) {
    // Many2many command [6, 0, ids] = replace the entire set with these IDs
    values.user_ids = [[6, 0, input.userIds]];
  }
  if (input.priority !== undefined) values.priority = input.priority;
  return odooCreate("project.task", values);
}
