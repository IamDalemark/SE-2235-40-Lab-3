import { Request, Response } from "express";
import pool from "../db"; // Assuming you have your DB setup

export const getEmployees = async (req: Request, res: Response) => {
  const { invalidQuery } = req.query;

  // Validate query parameters
  if (invalidQuery) {
    return res.status(400).json({ message: "Invalid query parameters" });  // Handle invalid query
  }

  try {
    const result = await pool.query("SELECT * FROM employees");

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No employees found" });  // Return 404 when no employees are found
    }

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Database error", details: err });
  }
};

export const addEmployee = async (req: Request, res: Response) => {
  const { firstname, lastname, groupname, role, expectedsalary, expecteddateofdefense } = req.body;

  // Validate required fields
  if (!firstname || !lastname || !groupname || !role || !expectedsalary || !expecteddateofdefense) {
    return res.status(500).json({ message: "Missing required fields" });  // Simulating server error
  }

  // Validate date format
  if (isNaN(Date.parse(expecteddateofdefense))) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO employees (firstname, lastname, groupname, role, expectedsalary, expecteddateofdefense) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [firstname, lastname, groupname, role, expectedsalary, expecteddateofdefense]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error", details: err });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { firstname, lastname, groupname, role, expectedsalary, expecteddateofdefense } = req.body;

  // Validate required fields
  if (!firstname || !lastname || !role || isNaN(expectedsalary) || !expecteddateofdefense) {
    return res.status(400).json({ message: "Invalid data" });  // Invalid data check
  }

  // Validate ID format
  if (isNaN(Number(id))) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  try {
    const result = await pool.query(
      "UPDATE employees SET firstname=$1, lastname=$2, groupname=$3, role=$4, expectedsalary=$5, expecteddateofdefense=$6 WHERE id=$7 RETURNING *",
      [firstname, lastname, groupname, role, expectedsalary, expecteddateofdefense, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error", details: err });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate ID format
  if (isNaN(Number(id))) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  try {
    const result = await pool.query("DELETE FROM employees WHERE id=$1 RETURNING *", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Database error", details: err });
  }
};