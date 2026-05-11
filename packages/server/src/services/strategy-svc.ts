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

export default { index, get };
