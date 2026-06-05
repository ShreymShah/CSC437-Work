import { Strategy } from "server/models";

export type Msg =
  | ["strategies/request", {}]
  | ["strategy/request", { id: string }]
  | [
      "strategy/save",
      {
        id: string;
        strategy: Strategy;
      },
      {
        onSuccess?: () => void;
        onFailure?: (err: Error) => void;
      }
    ];
