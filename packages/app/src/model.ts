import { Strategy } from "server/models";

export interface Model {
  strategies?: Strategy[];
  strategy?: Strategy;
  error?: string;
}

export const init: Model = {};
