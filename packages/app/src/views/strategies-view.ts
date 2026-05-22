import { css, html, shadow } from "@unbndl/html";

export class StrategiesViewElement extends HTMLElement {
  static styles = css`
    :host { display: block; padding: var(--space-xl); }
    h1 { color: var(--color-text-header); margin-bottom: var(--space-lg); }
    .strategy-list { list-style: none; padding: 0; display: grid; gap: var(--space-md); }
    .strategy-card {
      background-color: var(--color-background-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      padding: var(--space-md) var(--space-lg);
    }
    .strategy-card h2 { color: var(--color-text-header); font-size: 1rem; margin: 0 0 var(--space-xs); }
    .strategy-card p { color: var(--color-text-muted); font-size: 0.875rem; margin: 0; }
    .empty { color: var(--color-text-muted); }
  `;

  constructor() {
    super();
    shadow(this).styles(StrategiesViewElement.styles).replace(html`
      <h1>Strategies</h1>
      <div class="strategy-list"><p class="empty">Loading...</p></div>
    `);
  }

  connectedCallback() {
    this.loadStrategies();
  }

  get authorization() {
    const token = localStorage.getItem("un-auth:token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  loadStrategies() {
    fetch("/api/strategies", { headers: this.authorization })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        const list = Array.isArray(data) ? data : [data];
        const container = this.shadowRoot?.querySelector(".strategy-list");
        if (!container) return;
        if (list.length === 0) {
          container.innerHTML = `<p class="empty">No strategies found.</p>`;
          return;
        }
        container.innerHTML = "";
        list.forEach(s => {
          const card = document.createElement("div");
          card.className = "strategy-card";
          card.innerHTML = `<h2>${s.name || "Unnamed Strategy"}</h2><p>${s.logic || ""}</p>`;
          container.appendChild(card);
        });
      })
      .catch(() => {
        const container = this.shadowRoot?.querySelector(".strategy-list");
        if (container) container.innerHTML = `<p class="empty">Failed to load strategies.</p>`;
      });
  }
}
