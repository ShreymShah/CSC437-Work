import express, { Request, Response } from "express";
import { Strategy } from "../models/index.ts";
import Strategies from "../services/strategy-svc.ts";

const router = express.Router();

router.get("/", (_, res: Response) => {
  Strategies.index()
    .then((list: Strategy[]) => res.send(list))
    .catch((err) => res.status(500).send(err));
});

router.get("/:id", (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  Strategies.get(id)
    .then((strategy: Strategy | null) => {
      if (!strategy) res.status(404).send();
      else res.send(strategy);
    })
    .catch((err) => res.status(404).send(err));
});

router.post("/", (req: Request, res: Response) => {
  const newStrategy = req.body as Strategy;

  Strategies.create(newStrategy)
    .then((strategy: Strategy) => res.status(201).json(strategy))
    .catch((err) => res.status(500).send(err));
});

router.put("/:id", (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const updatedStrategy = req.body as Strategy;

  Strategies.update(id, updatedStrategy)
    .then((strategy: Strategy) => res.json(strategy))
    .catch((err) => res.status(404).send(err));
});

router.delete("/:id", (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  Strategies.remove(id)
    .then(() => res.status(204).end())
    .catch((err) => res.status(404).send(err));
});

export default router;
