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
  },
  { collection: "strategies" }
);

const StrategyModel = model<Strategy>("Strategy", strategySchema);

function index(): Promise<Strategy[]> {
  return StrategyModel.find();
}

function get(id: string): Promise<Strategy | null> {
  return StrategyModel.findOne({ id }).then((strategy) => {
    if (!strategy) throw `${id} Not Found`;
    return strategy;
  });
}

function create(json: Strategy): Promise<Strategy> {
  const t = new StrategyModel(json);
  return t.save();
}

function update(id: string, strategy: Strategy): Promise<Strategy> {
  return StrategyModel.findOneAndUpdate({ id }, strategy, { new: true }).then(
    (updated) => {
      if (!updated) throw `${id} not updated`;
      return updated as Strategy;
    }
  );
}

function remove(id: string): Promise<void> {
  return StrategyModel.findOneAndDelete({ id }).then((deleted) => {
    if (!deleted) throw `${id} not deleted`;
  });
}

export default { index, get, create, update, remove };
