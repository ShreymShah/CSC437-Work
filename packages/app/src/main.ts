import { define, html } from "@unbndl/html";
import { Auth } from "@unbndl/auth";
import { Store } from "@unbndl/store";
import { BrowserHistory, Switch } from "@unbndl/switch";
import { createView } from "@unbndl/view";
import { AlgoHeaderElement } from "./components/algo-header.ts";
import { HomeViewElement } from "./views/home-view.ts";
import { StrategiesViewElement } from "./views/strategies-view.ts";
import { StrategyViewElement } from "./views/strategy-view.ts";
import { Msg } from "./messages.ts";
import { Model, init } from "./model.ts";
import update, { Cmd } from "./update.ts";

// Hard-navigate to these real HTML pages if the SPA ends up at their URL
// (happens in Chrome where history.go() fires popstate instead of reloading)
class HardRedirect extends HTMLElement {
  connectedCallback() {
    window.location.assign(this.getAttribute("href") || "/");
  }
}

const routes: Switch.Route[] = [
  {
    path: "/app/strategies/:id/edit",
    view: createView<Switch.Args>(
      html`<strategy-view
        strategy-id=${($) => $.params.id}
        mode="edit"
      ></strategy-view>`
    )
  },
  {
    path: "/app/strategies/:id",
    view: createView<Switch.Args>(
      html`<strategy-view
        strategy-id=${($) => $.params.id}
        mode="view"
      ></strategy-view>`
    )
  },
  {
    path: "/app/strategies",
    view: createView<Switch.Args>(html`<strategies-view></strategies-view>`)
  },
  {
    path: "/app",
    view: createView<Switch.Args>(html`<home-view></home-view>`)
  },
  {
    path: "/login.html",
    view: createView<Switch.Args>(html`<hard-redirect href="/login.html"></hard-redirect>`)
  },
  {
    path: "/new-user.html",
    view: createView<Switch.Args>(html`<hard-redirect href="/new-user.html"></hard-redirect>`)
  },
  {
    path: "/",
    redirect: "/app"
  }
];

define({
  "hard-redirect": HardRedirect,
  "auth-provider": Auth.Provider,
  "history-provider": BrowserHistory.Provider,
  "algo-header": AlgoHeaderElement,
  "home-view": HomeViewElement,
  "strategies-view": StrategiesViewElement,
  "strategy-view": StrategyViewElement,
  "store-provider": class AppStore extends Store.Provider<Model, Msg, Cmd> {
    constructor() {
      super(update, init);
    }
  },
  "router-switch": class AppSwitch extends Switch.Element {
    constructor() {
      super(routes);
    }
  }
});
