import { css, html, shadow } from "@unbndl/html";
import { createView, createViewModel, View } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { Strategy } from "server/models";
import { Msg } from "../messages.ts";
import { Model } from "../model.ts";

interface StrategiesViewModel {
  strategies?: Strategy[];
  error?: string;
}

export class StrategiesViewElement extends HTMLElement {
  // Observe both the cached strategy list and any load error from the store.
  viewModel = createViewModel<StrategiesViewModel>({
    strategies: undefined,
    error: undefined
  })
    .with(fromStore<Model>(this), "strategies")
    .with(fromStore<Model>(this), "error");

  // A single strategy card. Built with the declarative `html` helper so the
  // name/description are escaped automatically (no raw innerHTML interpolation).
  cardView = createView<Strategy>(html`
    <a class="strategy-card" href=${($) => `/app/strategies/${$.id}`}>
      <h2>${($) => $.name || "Unnamed Strategy"}</h2>
      <p>${($) => $.description || ""}</p>
    </a>
  `);

  // Simple message rows for the loading / empty / error states.
  loadingView = createView<{}>(html`<p class="empty">Loading…</p>`);
  emptyView = createView<{}>(
    html`<p class="empty">No strategies found.</p>`
  );
  errorView = createView<{ error: string }>(
    html`<p class="error" role="alert">${($) => $.error}</p>`
  );

  view = createView<StrategiesViewModel>(html`
    <div class="list-header">
      <h1>Strategies</h1>
      <a class="new-link" href="/app/strategies/new">+ New Strategy</a>
    </div>
    <div class="strategy-list">
      ${($) =>
        $.error
          ? View.apply(this.errorView, { error: $.error })
          : !$.strategies
          ? View.apply(this.loadingView, {})
          : $.strategies.length === 0
          ? View.apply(this.emptyView, {})
          : View.map(this.cardView, $.strategies)}
    </div>
  `);

  constructor() {
    super();
    shadow(this)
      .styles(StrategiesViewElement.styles)
      .replace(this.viewModel.render(this.view));
  }

  connectedCallback() {
    Store.dispatch(this, ["strategies/request", {}] as Msg);
  }

  static styles = css`
    :host { display: block; padding: var(--space-xl); }
    .list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
    }
    h1 { color: var(--color-text-header); margin: 0; }
    .new-link {
      display: inline-flex;
      align-items: center;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.9rem;
      padding: var(--space-sm) var(--space-lg);
      border-radius: var(--border-radius);
      color: var(--color-background-page);
      background-color: var(--color-accent);
    }
    .new-link:hover { opacity: 0.85; }
    .strategy-list { list-style: none; padding: 0; display: grid; gap: var(--space-md); }
    .strategy-card {
      display: block;
      text-decoration: none;
      background-color: var(--color-background-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      padding: var(--space-md) var(--space-lg);
    }
    .strategy-card:hover { border-color: var(--color-accent-dim); }
    .strategy-card h2 { color: var(--color-text-header); font-size: 1rem; margin: 0 0 var(--space-xs); }
    .strategy-card p { color: var(--color-text-muted); font-size: 0.875rem; margin: 0; }
    .empty { color: var(--color-text-muted); }
    .error { color: rgb(220 60 60); font-size: 0.9rem; margin: 0; }
  `;
}
