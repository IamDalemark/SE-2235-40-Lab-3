import { Employee } from "../../types/employee.type";
export const sampleEmployee: Employee = {
  firstname: "John",
  lastname: "Doe",
  groupname: "Engineering",
  role: "Developer",
  expectedsalary: 75000,
  expecteddateofdefense: "2025-06-15T16:00:00.000Z"
};

export const incompleteEmployee: Partial<Employee> = {
  firstname: "Jane",
  // Missing other required fields
};