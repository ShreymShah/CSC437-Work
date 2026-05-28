import { Auth } from "@unbndl/auth";
import { Message } from "@unbndl/service";
import { Strategy } from "server/models";
import { Model } from "./model.ts";
import { Msg } from "./messages.ts";

export type Cmd =
  | ["strategies/load", { strategies: Strategy[] }]
  | ["strategy/load", { strategy: Strategy }];

export default function update(
  model: Readonly<Model>,
  message: Msg | Cmd,
  auth: Auth.Model
): Model | Message.Async<Model, Cmd> {
  const [type, payload] = message as [string, Record<string, unknown>];
  switch (type) {
    case "strategies/request":
      return [
        { ...model },
        fetchStrategies(auth)
      ] as Message.Async<Model, Cmd>;
    case "strategies/load":
      return { ...model, strategies: (payload as { strategies: Strategy[] }).strategies };
    case "strategy/request":
      return [
        { ...model, strategy: undefined },
        fetchStrategy((payload as { id: string }).id, auth)
      ] as Message.Async<Model, Cmd>;
    case "strategy/load":
      return { ...model, strategy: (payload as { strategy: Strategy }).strategy };
    default:
      throw new Error(`Unhandled message "${type}"`);
  }
}

function fetchStrategies(auth: Auth.Model): Promise<Cmd | Message.None> {
  return fetch("/api/strategies", {
    headers: Auth.headers(auth) as HeadersInit
  })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error(`HTTP ${res.status}`);
    })
    .then((data: unknown) => {
      const strategies = Array.isArray(data) ? data as Strategy[] : [];
      return ["strategies/load", { strategies }] as Cmd;
    })
    .catch(() => Message.None);
}

function fetchStrategy(id: string, auth: Auth.Model): Promise<Cmd | Message.None> {
  return fetch(`/api/strategies/${id}`, {
    headers: Auth.headers(auth) as HeadersInit
  })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error(`HTTP ${res.status}`);
    })
    .then((data: unknown) => {
      return ["strategy/load", { strategy: data as Strategy }] as Cmd;
    })
    .catch(() => Message.None);
}
