import { Strategy } from "../models/index.ts";

const strategies: { [key: string]: Strategy } = {
  "mean-reversion-alpha": {
    id: "mean-reversion-alpha",
    name: "Mean Reversion Alpha",
    description:
      "Enters positions when price deviates 2 standard deviations from the 20-day SMA.",
    components: [
      { label: "Generates", href: "signal.html", value: "Latest Buy Signal (BTC)" },
      { label: "Trades", href: "instrument.html", value: "Bitcoin (BTC/USD)" },
      { label: "Validated By", href: "backtest.html", value: "Q1 2024 Historical Simulation" },
      { label: "Routes Via", href: "broker.html", value: "Coinbase Exchange" }
    ],
    status: [
      { label: "Status", status: "active", value: "Active" },
      { label: "Asset", href: "instrument.html", value: "BTC/USD" },
      { label: "Signal Strength", unit: "%", value: "85" }
    ]
  }
};

function get(id: string): Strategy | undefined {
  return strategies[id];
}

export default { get };
