import express, { Request, Response } from "express";
import Strategies from "./services/strategy-svc.ts";

const app = express();
const port = process.env.PORT || 3000;
const staticDir = process.env.STATIC || "public";

app.use(express.static(staticDir));

// Middleware
app.use(express.json());

app.get("/hello", (req: Request, res: Response) => {
  res.send("Hello, World");
});

app.get("/api/strategies/:id", (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const data = Strategies.get(id);

  if (data) res.send(data);
  else res.status(404).send();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
