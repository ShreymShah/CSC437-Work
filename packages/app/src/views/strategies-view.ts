import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { Strategy } from "server/models";
import { Msg } from "../messages.ts";
import { Model } from "../model.ts";

interface StrategiesViewModel {
  strategies?: Strategy[];
}

export class StrategiesViewElement extends HTMLElement {
  viewModel = createViewModel<StrategiesViewModel>({ strategies: undefined })
    .with(fromStore<Model>(this), "strategies");

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
  `;

  constructor() {
    super();
    shadow(this).styles(StrategiesViewElement.styles).replace(html`
      <div class="list-header">
        <h1>Strategies</h1>
        <a class="new-link" href="/app/strategies/new">+ New Strategy</a>
      </div>
      <div class="strategy-list"><p class="empty">Loading...</p></div>
    `);

    this.viewModel.createEffect(($) => {
      this._render($.strategies);
    });
  }

  connectedCallback() {
    Store.dispatch(this, ["strategies/request", {}] as Msg);
  }

  private _render(strategies?: Strategy[]) {
    const container = this.shadowRoot?.querySelector(".strategy-list");
    if (!container) return;
    if (!strategies) {
      container.innerHTML = `<p class="empty">Loading...</p>`;
      return;
    }
    if (strategies.length === 0) {
      container.innerHTML = `<p class="empty">No strategies found.</p>`;
      return;
    }
    container.innerHTML = "";
    strategies.forEach(s => {
      const card = document.createElement("a");
      card.className = "strategy-card";
      card.setAttribute("href", `/app/strategies/${s.id}`);
      card.innerHTML = `<h2>${s.name || "Unnamed Strategy"}</h2><p>${s.description || ""}</p>`;
      container.appendChild(card);
    });
  }
}
