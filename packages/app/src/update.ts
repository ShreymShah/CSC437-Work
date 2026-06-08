import { Auth } from "@unbndl/auth";
import { Message } from "@unbndl/service";
import { Strategy } from "server/models";
import { Model } from "./model.ts";
import { Msg } from "./messages.ts";

export type Cmd =
  | ["strategies/load", { strategies: Strategy[] }]
  | ["strategies/error", { message: string }]
  | ["strategy/load", { strategy: Strategy }];

export default function update(
  model: Readonly<Model>,
  message: Msg | Cmd,
  auth: Auth.Model
): Model | Message.Async<Model, Cmd> {
  const [command, payload] = message;
  switch (command) {
    case "strategies/request":
      return [
        { ...model, error: undefined },
        fetchStrategies(auth)
      ] as Message.Async<Model, Cmd>;

    case "strategies/load":
      return {
        ...model,
        error: undefined,
        strategies: (payload as { strategies: Strategy[] }).strategies
      };

    case "strategies/error":
      return {
        ...model,
        error: (payload as { message: string }).message
      };

    case "strategy/request":
      return [
        { ...model, strategy: undefined },
        fetchStrategy((payload as { id: string }).id, auth)
      ] as Message.Async<Model, Cmd>;

    case "strategy/load": {
      const { strategy } = payload as { strategy: Strategy };
      // Keep the cached list in sync with the freshly loaded strategy so
      // every view observing the store (e.g. the list) reflects it. Replace
      // the matching entry if it exists, otherwise append it (handles create).
      const strategies = model.strategies
        ? model.strategies.some((s) => s.id === strategy.id)
          ? model.strategies.map((s) => (s.id === strategy.id ? strategy : s))
          : [...model.strategies, strategy]
        : model.strategies;
      return { ...model, strategy, strategies };
    }

    case "strategy/create":
      // Like save, but POSTs a brand-new strategy. The resolved
      // "strategy/load" command folds the created record into the store.
      return [
        { ...model },
        createStrategy(payload as { strategy: Strategy }, auth)
      ] as Message.Async<Model, Cmd>;

    case "strategy/save":
      // Don't touch the model yet — wait for the PUT response, then the
      // resolved "strategy/load" command updates the store atomically.
      return [
        { ...model },
        saveStrategy(payload as { id: string; strategy: Strategy }, auth)
      ] as Message.Async<Model, Cmd>;

    default: {
      // Exhaustiveness check: if every Msg/Cmd is handled above, `command`
      // narrows to `never` here. Forget a case and TypeScript will flag it.
      const unhandled: never = command;
      throw new Error(`Unhandled message "${unhandled}"`);
    }
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
    .catch(() =>
      ["strategies/error", {
        message: "Couldn't load strategies. Please try again."
      }] as Cmd
    );
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

// Like fetchStrategy, but issues a PUT with the edited strategy as the JSON
// body. The server responds with the updated record, which we feed back into
// the store as a "strategy/load" command.
function saveStrategy(
  payload: { id: string; strategy: Strategy },
  auth: Auth.Model
): Promise<Cmd | Message.None> {
  return fetch(`/api/strategies/${payload.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...Auth.headers(auth)
    } as HeadersInit,
    body: JSON.stringify(payload.strategy)
  })
    .then((res: Response) => {
      if (res.ok) return res.json();
      throw new Error(`HTTP ${res.status} saving strategy ${payload.id}`);
    })
    .then((data: unknown) => {
      if (data) return ["strategy/load", { strategy: data as Strategy }] as Cmd;
      throw new Error("No JSON in API response");
    })
    .catch((err: Error) => {
      // Re-throw so the dispatcher's onFailure reaction fires (and so every
      // path returns a Promise<Cmd>, satisfying the type checker).
      console.log("Error saving strategy:", err);
      throw err;
    });
}

// Like saveStrategy, but issues a POST to create a new strategy. The server
// responds with the created record, fed back as a "strategy/load" command.
function createStrategy(
  payload: { strategy: Strategy },
  auth: Auth.Model
): Promise<Cmd | Message.None> {
  return fetch("/api/strategies", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...Auth.headers(auth)
    } as HeadersInit,
    body: JSON.stringify(payload.strategy)
  })
    .then((res: Response) => {
      if (res.ok) return res.json();
      throw new Error(`HTTP ${res.status} creating strategy`);
    })
    .then((data: unknown) => {
      if (data) return ["strategy/load", { strategy: data as Strategy }] as Cmd;
      throw new Error("No JSON in API response");
    })
    .catch((err: Error) => {
      console.log("Error creating strategy:", err);
      throw err;
    });
}
