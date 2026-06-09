import express, { Response } from "express";
import { Strategy } from "../models/index.ts";
import Strategies from "../services/strategy-svc.ts";
import { AuthedRequest } from "./auth.ts";

const router = express.Router();

router.get("/", (req: AuthedRequest, res: Response) => {
  const owner = req.username ?? "";
  Strategies.index(owner)
    .then((list: Strategy[]) => res.send(list))
    .catch((err) => res.status(500).send(err));
});

router.get("/:id", (req: AuthedRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const owner = req.username ?? "";

  Strategies.get(id, owner)
    .then((strategy: Strategy | null) => {
      if (!strategy) res.status(404).send();
      else res.send(strategy);
    })
    .catch((err) => res.status(404).send(err));
});

router.post("/", (req: AuthedRequest, res: Response) => {
  const newStrategy = req.body as Strategy;
  const owner = req.username ?? "";

  Strategies.create(newStrategy, owner)
    .then((strategy: Strategy) => res.status(201).json(strategy))
    .catch((err) => res.status(500).send(err));
});

router.put("/:id", (req: AuthedRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const updatedStrategy = req.body as Strategy;
  const owner = req.username ?? "";

  Strategies.update(id, updatedStrategy, owner)
    .then((strategy: Strategy) => res.json(strategy))
    .catch((err) => res.status(404).send(err));
});

router.delete("/:id", (req: AuthedRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const owner = req.username ?? "";

  Strategies.remove(id, owner)
    .then(() => res.status(204).end())
    .catch((err) => res.status(404).send(err));
});

export default router;
