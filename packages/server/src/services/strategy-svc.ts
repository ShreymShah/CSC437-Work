import { Schema, model } from "mongoose";
import { Strategy } from "../models/index.ts";

const algoStatSchema = {
  label: String,
  value: String,
  href: String,
  unit: String,
  status: String,
};

const strategySchema = new Schema<Strategy>(
  {
    id: String,
    name: String,
    description: String,
    components: [algoStatSchema],
    status: [algoStatSchema],
    owner: String,
  },
  { collection: "strategies" }
);

const StrategyModel = model<Strategy>("Strategy", strategySchema);

// Every operation is scoped to the owning user's username so accounts only see
// and modify their own strategies.
function index(owner: string): Promise<Strategy[]> {
  return StrategyModel.find({ owner });
}

function get(id: string, owner: string): Promise<Strategy | null> {
  return StrategyModel.findOne({ id, owner }).then((strategy) => {
    if (!strategy) throw `${id} Not Found`;
    return strategy;
  });
}

function create(json: Strategy, owner: string): Promise<Strategy> {
  const t = new StrategyModel({ ...json, owner });
  return t.save();
}

function update(
  id: string,
  strategy: Strategy,
  owner: string
): Promise<Strategy> {
  return StrategyModel.findOneAndUpdate(
    { id, owner },
    { ...strategy, owner },
    { new: true }
  ).then((updated) => {
    if (!updated) throw `${id} not updated`;
    return updated as Strategy;
  });
}

function remove(id: string, owner: string): Promise<void> {
  return StrategyModel.findOneAndDelete({ id, owner }).then((deleted) => {
    if (!deleted) throw `${id} not deleted`;
  });
}

export default { index, get, create, update, remove };
