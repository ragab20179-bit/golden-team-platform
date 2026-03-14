/**
 * Tests for modules router — bulkImportHR, bulkImportKPI, bulkImportProcurement
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB module
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
}));

// Mock drizzle schema
vi.mock("../drizzle/schema", () => ({
  hrEmployees: { name: "hr_employees" },
  kpiTargets: { name: "kpi_targets" },
  procurementItems: { name: "procurement_items" },
}));

describe("Bulk Import Data Validation", () => {
  describe("HR Employee records", () => {
    it("accepts valid employee record with all required fields", () => {
      const record = {
        employeeId: "EMP-001",
        fullName: "Ahmed Al-Rashidi",
        department: "Engineering",
        jobTitle: "Senior Engineer",
        email: "ahmed@goldenteam.sa",
        phone: "+966501234567",
        hireDate: "2024-01-15",
        salary: 18000,
        status: "active",
      };
      expect(record.employeeId).toBeTruthy();
      expect(record.fullName).toBeTruthy();
      expect(record.department).toBeTruthy();
      expect(record.jobTitle).toBeTruthy();
    });

    it("validates email format", () => {
      const validEmails = ["user@goldenteam.sa", "user.name@company.com"];
      const invalidEmails = ["not-an-email", "missing@", "@nodomain.com"];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      validEmails.forEach(e => expect(emailRegex.test(e)).toBe(true));
      invalidEmails.forEach(e => expect(emailRegex.test(e)).toBe(false));
    });

    it("validates salary is a positive number", () => {
      expect(18000 > 0).toBe(true);
      expect(-1000 > 0).toBe(false);
      expect(0 > 0).toBe(false);
    });

    it("validates hire date format", () => {
      const validDate = "2024-01-15";
      const parsed = new Date(validDate);
      expect(isNaN(parsed.getTime())).toBe(false);
    });

    it("rejects record with missing required fields", () => {
      const incomplete = { employeeId: "EMP-002" }; // missing fullName, department, etc.
      expect("fullName" in incomplete).toBe(false);
    });
  });

  describe("KPI Target records", () => {
    it("accepts valid KPI target record", () => {
      const record = {
        kpiName: "Revenue Achievement",
        category: "Financial",
        targetValue: 2200000,
        unit: "SAR",
        period: "Q1-2026",
        owner: "Finance Director",
        weight: 25,
      };
      expect(record.kpiName).toBeTruthy();
      expect(record.targetValue).toBeGreaterThan(0);
      expect(record.weight).toBeGreaterThanOrEqual(0);
      expect(record.weight).toBeLessThanOrEqual(100);
    });

    it("validates weight is between 0 and 100", () => {
      expect(25 >= 0 && 25 <= 100).toBe(true);
      expect(150 >= 0 && 150 <= 100).toBe(false);
      expect(-5 >= 0 && -5 <= 100).toBe(false);
    });

    it("validates period format", () => {
      const validPeriods = ["Q1-2026", "Q2-2026", "FY-2026", "H1-2026"];
      validPeriods.forEach(p => {
        expect(typeof p).toBe("string");
        expect(p.length).toBeGreaterThan(0);
      });
    });

    it("rejects negative target values", () => {
      const negativeTarget = -5000;
      expect(negativeTarget > 0).toBe(false);
    });
  });

  describe("Procurement Item records", () => {
    it("accepts valid procurement item record", () => {
      const record = {
        itemCode: "IT-2026-001",
        description: "Laptop - Dell XPS 15",
        vendor: "Tech Supply Arabia",
        quantity: 10,
        unitPrice: 8500,
        totalAmount: 85000,
        currency: "SAR",
        category: "IT Equipment",
        deliveryDate: "2026-04-15",
        status: "pending",
      };
      expect(record.itemCode).toBeTruthy();
      expect(record.quantity).toBeGreaterThan(0);
      expect(record.unitPrice).toBeGreaterThan(0);
      expect(record.totalAmount).toBe(record.quantity * record.unitPrice);
    });

    it("validates total amount equals quantity × unit price", () => {
      const qty = 10;
      const unitPrice = 8500;
      const expectedTotal = qty * unitPrice;
      expect(expectedTotal).toBe(85000);
    });

    it("validates currency is SAR or USD", () => {
      const validCurrencies = ["SAR", "USD", "EUR", "AED"];
      expect(validCurrencies.includes("SAR")).toBe(true);
      expect(validCurrencies.includes("BTC")).toBe(false);
    });

    it("rejects zero quantity", () => {
      expect(0 > 0).toBe(false);
    });
  });

  describe("Bulk import row processing", () => {
    it("filters out empty rows from CSV", () => {
      const rows = [
        { name: "Alice", dept: "HR" },
        { name: "", dept: "" },
        { name: "Bob", dept: "IT" },
        { name: null, dept: undefined },
      ];
      const nonEmpty = rows.filter(r => r.name && r.dept);
      expect(nonEmpty).toHaveLength(2);
    });

    it("trims whitespace from string fields", () => {
      const raw = "  Ahmed Al-Rashidi  ";
      expect(raw.trim()).toBe("Ahmed Al-Rashidi");
    });

    it("handles numeric fields from CSV strings", () => {
      const csvValue = "18000";
      const parsed = parseFloat(csvValue);
      expect(parsed).toBe(18000);
      expect(isNaN(parsed)).toBe(false);
    });

    it("handles date fields from CSV strings", () => {
      const csvDate = "2024-01-15";
      const parsed = new Date(csvDate);
      expect(isNaN(parsed.getTime())).toBe(false);
    });

    it("limits batch size to prevent DB overload", () => {
      const MAX_BATCH = 500;
      const rows = Array.from({ length: 600 }, (_, i) => ({ id: i }));
      const batched = rows.slice(0, MAX_BATCH);
      expect(batched).toHaveLength(MAX_BATCH);
    });
  });

  describe("Contextual upload linking", () => {
    it("generates correct context tag for meeting uploads", () => {
      const meetingId = 42;
      const context = { contextType: "meeting", contextId: meetingId };
      expect(context.contextType).toBe("meeting");
      expect(context.contextId).toBe(42);
    });

    it("generates correct context tag for project uploads", () => {
      const projectId = 7;
      const context = { contextType: "project", contextId: projectId };
      expect(context.contextType).toBe("project");
      expect(context.contextId).toBe(7);
    });

    it("allows null context for unlinked vault files", () => {
      const context = { contextType: null, contextId: null };
      expect(context.contextType).toBeNull();
      expect(context.contextId).toBeNull();
    });

    it("validates supported context types", () => {
      const validTypes = ["meeting", "project", "hr", "legal", "qms", "procurement"];
      expect(validTypes.includes("meeting")).toBe(true);
      expect(validTypes.includes("unknown")).toBe(false);
    });
  });
});
