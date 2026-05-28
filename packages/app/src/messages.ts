export type Msg =
  | ["strategies/request", {}]
  | ["strategy/request", { id: string }];
