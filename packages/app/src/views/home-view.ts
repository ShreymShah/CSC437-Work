import { css, html, shadow } from "@unbndl/html";

export class HomeViewElement extends HTMLElement {
  static template = html`<template>
    <div class="home">
      <h1>AlgoTrader Dashboard</h1>
      <p>Welcome to AlgoTrader. Select a section to get started.</p>
      <nav class="home-nav">
        <a href="/app/strategies">
          View Strategies
        </a>
      </nav>
    </div>
  </template>`;

  static styles = css`
    :host { display: block; padding: var(--space-xl); }
    .home { max-width: 600px; }
    h1 { color: var(--color-text-header); margin-bottom: var(--space-md); }
    p { color: var(--color-text-muted); margin-bottom: var(--space-lg); }
    .home-nav { display: flex; gap: var(--space-md); }
    .home-nav a {
      display: flex; align-items: center; gap: var(--space-sm);
      background-color: var(--color-background-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      padding: var(--space-md) var(--space-lg);
      color: var(--color-accent); text-decoration: none;
      font-weight: 700;
    }
    .home-nav a:hover { border-color: var(--color-accent-dim); }
  `;

  constructor() {
    super();
    shadow(this)
      .template(HomeViewElement.template)
      .styles(HomeViewElement.styles);
  }
}
