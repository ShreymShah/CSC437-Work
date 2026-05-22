import { define, html } from "@unbndl/html";
import { Auth } from "@unbndl/auth";
import { BrowserHistory, Switch } from "@unbndl/switch";
import { AlgoHeaderElement } from "./components/algo-header.ts";
import { HomeViewElement } from "./views/home-view.ts";
import { StrategiesViewElement } from "./views/strategies-view.ts";

const routes = [
  {
    path: "/app/strategies",
    view: () => html`<strategies-view></strategies-view>`
  },
  {
    path: "/app",
    view: () => html`<home-view></home-view>`
  },
  {
    path: "/",
    redirect: "/app"
  }
];

define({
  "auth-provider": Auth.Provider,
  "history-provider": BrowserHistory.Provider,
  "algo-header": AlgoHeaderElement,
  "home-view": HomeViewElement,
  "strategies-view": StrategiesViewElement,
  "router-switch": class AppSwitch extends Switch.Element {
    constructor() {
      super(routes);
    }
  }
});
