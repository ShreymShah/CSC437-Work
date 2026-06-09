export interface AlgoStat {
  label: string;
  value: string;
  href?: string;
  unit?: string;
  status?: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  components: AlgoStat[];
  status: AlgoStat[];
  // Username of the account that owns this strategy. Stamped by the server on
  // create; clients don't set it. Optional so client-side code that builds a
  // Strategy (e.g. the create form) doesn't need to supply it.
  owner?: string;
}
