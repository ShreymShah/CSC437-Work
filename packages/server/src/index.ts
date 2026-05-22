import express, { Request, Response } from "express";
import fs from "node:fs/promises";
import path from "path";
import { connect } from "./services/mongo.ts";
import strategies from "./routes/strategies.ts";
import auth, { authenticateUser } from "./routes/auth.ts";

const app = express();
const port = process.env.PORT || 3000;
const staticDir = process.env.STATIC || "public";

connect("csc437db");

app.use(express.static(staticDir));
app.use(express.json());

app.get("/hello", (req: Request, res: Response) => {
  res.send("Hello, World");
});

app.use("/auth", auth);
app.use("/api/strategies", authenticateUser, strategies);

// SPA Routes: /app/...
app.use("/app", (req: Request, res: Response) => {
  const indexHtml = path.resolve(staticDir, "index.html");
  fs.readFile(indexHtml, { encoding: "utf8" }).then((html) =>
    res.send(html)
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
