import { Strategy } from "server/models";

export interface Model {
  strategies?: Strategy[];
  strategy?: Strategy;
}

export const init: Model = {};
