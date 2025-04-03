import request from "supertest";
import { Pool } from "pg";
import { app } from "../../server";
import { Employee } from "../../types/employee.type";
import { sampleEmployee, incompleteEmployee } from "../mockData/employee.sample";


const testPool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, })
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
  await testPool.query("DELETE FROM employees")
});


afterAll(async (): Promise<void> => {

  await testPool.end();
});

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
});

describe(`POST ${route}`, () => {
  it('creates a new employee and returns 201 status', async (): Promise<void> => {
    const response: request.Response = await request(app)
      .post(route)
      .send(sampleEmployee)


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

    expect(response.status).toBe(500);
  });
});


describe(`PUT ${route}/:id`, () => {
  let employeeId: number;

  beforeEach(async (): Promise<void> => {
    await testPool.query("BEGIN");

    const createResponse: request.Response = await request(app)
      .post(route)
      .send(sampleEmployee);

    employeeId = createResponse.body.id;
  });

  afterEach(async (): Promise<void> => {
    await testPool.query("ROLLBACK");
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
});


describe(`DELETE ${route}/:id`, () => {
  let employeeId: number;

  beforeEach(async (): Promise<void> => {
    // Create test employee using the API
    const createResponse: request.Response = await request(app)
      .post(route)
      .send(sampleEmployee);

    employeeId = createResponse.body.id;
  });

  it('deletes an employee and returns 204 status', async (): Promise<void> => {
    const response: request.Response = await request(app)
      .delete(`${route}/${employeeId}`);

    expect(response.status).toBe(204);

    // Verifies the employee was deleted
    const getResponse: request.Response = await request(app)
      .get(`${route}/${employeeId}`);

    expect(getResponse.status).toBe(404);
  });
});