import express from "express";
import cors from "cors";
import employeeRoutes from "./routes/employee";

export const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use("/employees", employeeRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
} 