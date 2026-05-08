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
}
