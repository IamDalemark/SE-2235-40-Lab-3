import request from "supertest";
import { Pool } from "pg";
import { app } from "../../server";
import { Employee } from "../../types/employee.type";
import { sampleEmployee, incompleteEmployee } from "../mockData/employee.sample";

const testPool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
const route = "/employees";

beforeAll(async (): Promise<void> => {
  await testPool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      firstname VARCHAR(100) NOT NULL,
      lastname VARCHAR(100) NOT NULL,
      groupname VARCHAR(100),
      role VARCHAR(100),
      expectedsalary INTEGER,
      expecteddateofdefense DATE
    );
  `);
});

beforeEach(async (): Promise<void> => {
  await testPool.query("BEGIN");
});

afterEach(async (): Promise<void> => {
  await testPool.query("ROLLBACK");
  await testPool.query("DELETE FROM employees");
});

afterAll(async (): Promise<void> => {
  await testPool.end();
});

// GET /employees tests
describe(`GET ${route}`, () => {
  it('responds with 200 status and returns JSON', async (): Promise<void> => {
    const response: request.Response = await request(app)
      .get(route)
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
  });

  it('returns expected employee data structure', async (): Promise<void> => {
    const response: request.Response = await request(app)
      .get(route)
      .set('Accept', 'application/json');

    if (response.body.length > 0) {
      const employee: Employee = response.body[0];
      expect(employee).toHaveProperty('id');
      expect(employee).toHaveProperty('firstname');
      expect(employee).toHaveProperty('lastname');
      expect(employee).toHaveProperty('role');
      expect(employee).toHaveProperty('expectedsalary');
      expect(employee).toHaveProperty('expecteddateofdefense');
    }
  });


  it('returns 400 when invalid query parameters are provided', async (): Promise<void> => {
    const response: request.Response = await request(app)
      .get(`${route}?invalidQuery=abc`)
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);  // Bad Request
  });
});

// POST /employees tests
describe(`POST ${route}`, () => {
  it('creates a new employee and returns 201 status', async (): Promise<void> => {
    const response: request.Response = await request(app)
      .post(route)
      .send(sampleEmployee);

    expect(response.status).toBe(201);
    expect(response.headers['content-type']).toMatch(/json/);

    const createdEmployee: Employee = response.body;
    expect(createdEmployee).toHaveProperty('id');
    expect(createdEmployee.firstname).toBe(sampleEmployee.firstname);
    expect(createdEmployee.lastname).toBe(sampleEmployee.lastname);
  });

  it('returns 500 when missing required fields', async (): Promise<void> => {
    const response: request.Response = await request(app)
      .post(route)
      .send(incompleteEmployee)
      .set('Accept', 'application/json');

    expect(response.status).toBe(500);  // Internal Server Error due to missing required fields
  });

  it('returns 400 when invalid date format is provided', async (): Promise<void> => {
    const invalidEmployee = { ...sampleEmployee, expecteddateofdefense: 'invalid-date' };

    const response: request.Response = await request(app)
      .post(route)
      .send(invalidEmployee)
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);  // Bad Request due to invalid date format
  });
});

// PUT /employees/:id tests
describe(`PUT ${route}/:id`, () => {
  let employeeId: number;

  beforeEach(async (): Promise<void> => {
    const createResponse: request.Response = await request(app)
      .post(route)
      .send(sampleEmployee);

    employeeId = createResponse.body.id;
  });

  it('updates an existing employee', async (): Promise<void> => {
    const updatedData: Employee = {
      ...sampleEmployee,
      firstname: "UpdatedName",
      expectedsalary: 85000
    };

    const response: request.Response = await request(app)
      .put(`${route}/${employeeId}`)
      .send(updatedData)
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.firstname).toBe(updatedData.firstname);
    expect(response.body.expectedsalary).toBe(updatedData.expectedsalary);
  });

  it('returns 404 when trying to update a non-existent employee', async (): Promise<void> => {
    const invalidEmployeeId = 999999;  // Assuming this ID doesn't exist

    const updatedData: Employee = {
      ...sampleEmployee,
      firstname: "UpdatedName",
    };

    const response: request.Response = await request(app)
      .put(`${route}/${invalidEmployeeId}`)
      .send(updatedData)
      .set('Accept', 'application/json');

    expect(response.status).toBe(404);  // Not Found
  });

  it('returns 400 when invalid data is provided', async (): Promise<void> => {
    const updatedData: Employee = {
      ...sampleEmployee,
      firstname: "",  // Empty firstname, invalid
      expectedsalary: -50000  // Invalid salary
    };

    const response: request.Response = await request(app)
      .put(`${route}/${employeeId}`)
      .send(updatedData)
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);  // Bad Request
  });
});

// DELETE /employees/:id tests
describe(`DELETE ${route}/:id`, () => {
  let employeeId: number;

  beforeEach(async (): Promise<void> => {
    const createResponse: request.Response = await request(app)
      .post(route)
      .send(sampleEmployee);

    employeeId = createResponse.body.id;
  });

  it('deletes an employee and returns 204 status', async (): Promise<void> => {
    const response: request.Response = await request(app)
      .delete(`${route}/${employeeId}`);

    expect(response.status).toBe(204);

    const getResponse: request.Response = await request(app)
      .get(`${route}/${employeeId}`);

    expect(getResponse.status).toBe(404);  // Employee should not be found
  });

  it('returns 404 when trying to delete a non-existent employee', async (): Promise<void> => {
    const invalidEmployeeId = 999999;  // Non-existent employee ID

    const response: request.Response = await request(app)
      .delete(`${route}/${invalidEmployeeId}`);

    expect(response.status).toBe(404);  // Not Found
  });

  it('returns 400 when invalid ID format is provided', async (): Promise<void> => {
    const invalidEmployeeId = 'invalid-id';  // Non-numeric ID

    const response: request.Response = await request(app)
      .delete(`${route}/${invalidEmployeeId}`);

    expect(response.status).toBe(400);  // Bad Request due to invalid ID format
  });
});
