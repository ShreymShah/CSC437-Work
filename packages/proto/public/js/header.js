import { css, html, shadow } from "@unbndl/html";
import reset from "./styles/reset.css.js";

export class AlgoHeaderElement extends HTMLElement {
  constructor() {
    super();
    shadow(this)
      .styles(reset.styles, AlgoHeaderElement.styles)
      .replace(this.buildView())
      .delegate(".when-signed-in button", {
        click: () => this.signout()
      });

    this.shadowRoot.addEventListener("change", (ev) => {
      if (ev.target?.type === "checkbox") {
        document.body.classList.toggle("light-mode", ev.target.checked);
      }
    });
  }

  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    // Show current auth state from localStorage immediately
    this._syncFromStorage();

    // Update whenever sign-in or sign-out happens
    this._authHandler = (ev) => {
      const [type, payload] = ev.detail || [];
      if (type === "auth/signin" && payload?.token) {
        this._updateAuth(true, this._decodeUsername(payload.token));
      } else if (type === "auth/signout") {
        this._updateAuth(false, undefined);
      }
    };
    // Listen on `this` (at-target phase) so auth-provider's stopPropagation can't block us
    this.addEventListener("auth:message", this._authHandler);
  }

  disconnectedCallback() {
    if (this._authHandler) {
      this.removeEventListener("auth:message", this._authHandler);
    }
  }

  _syncFromStorage() {
    const token = localStorage.getItem("un-auth:token");
    if (token) this._updateAuth(true, this._decodeUsername(token));
  }

  _decodeUsername(token) {
    try {
      return JSON.parse(atob(token.split(".")[1])).username;
    } catch {
      return undefined;
    }
  }

  _updateAuth(authenticated, username) {
    const root = this.shadowRoot;
    if (!root) return;
    const nav = root.querySelector(".header-user");
    const span = root.querySelector(".user-name");
    if (nav) nav.className = authenticated ? "header-user logged-in" : "header-user logged-out";
    if (span) span.textContent = username || "traveler";
  }

  buildView() {
    return html`
      <header>
        <a href="/index.html" class="header-brand">
          <span class="brand-icon">▲</span>
          <span class="brand-name">AlgoTrader</span>
        </a>
        <span class="header-title"><slot></slot></span>
        <nav class="header-nav">
          <a href="/signal.html">Signals</a>
          <a href="/instrument.html">Instruments</a>
          <a href="/backtest.html">Backtests</a>
          <a href="/broker.html">Brokers</a>
        </nav>
        <label class="theme-toggle-label">
          <input type="checkbox" autocomplete="off" />
          Light mode
        </label>
        <nav class="header-user logged-out">
          <span class="user-name">traveler</span>
          <menu>
            <li class="when-signed-in">
              <button class="signout-btn">Sign Out</button>
            </li>
            <li class="when-signed-out">
              <a href="/login.html">Sign In</a>
            </li>
          </menu>
        </nav>
      </header>
    `;
  }

  signout() {
    this.dispatchEvent(
      new CustomEvent("auth:message", {
        bubbles: true,
        composed: true,
        detail: ["auth/signout"]
      })
    );
  }

  static styles = css`
    :host { display: block; }
    header {
      display: flex;
      align-items: center;
      gap: var(--space-lg);
      background-color: var(--color-background-header);
      color: var(--color-text-header);
      padding: 0 var(--space-lg);
      height: 60px;
      border-bottom: 2px solid var(--color-border-accent);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--color-accent);
      text-decoration: none;
      flex-shrink: 0;
    }
    .brand-icon { font-size: 1.3rem; line-height: 1; }
    .header-title {
      flex: 1;
      font-size: 0.875rem;
      color: var(--color-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    .header-nav {
      display: flex;
      gap: var(--space-xs);
      align-items: center;
      flex-shrink: 0;
    }
    .header-nav a {
      color: var(--color-text-muted);
      text-decoration: none;
      font-size: 0.8rem;
      padding: var(--space-xs) var(--space-sm);
      border-radius: var(--border-radius);
    }
    .header-nav a:hover {
      color: var(--color-text-header);
      background-color: var(--color-background-surface);
    }
    .theme-toggle-label {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      color: var(--color-text-muted);
      font-size: 0.8rem;
      cursor: pointer;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .theme-toggle-label:hover { color: var(--color-text-header); }
    .header-user {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      color: var(--color-text-muted);
      font-size: 0.8rem;
      flex-shrink: 0;
    }
    menu {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      gap: var(--space-sm);
    }
    li { display: none; }
    .logged-in .when-signed-in,
    .logged-out .when-signed-out { display: list-item; }
    .signout-btn {
      background: none;
      border: 1px solid var(--color-border);
      color: var(--color-text-muted);
      border-radius: var(--border-radius);
      padding: var(--space-xs) var(--space-sm);
      font-size: 0.8rem;
      cursor: pointer;
    }
    .signout-btn:hover {
      color: var(--color-text-header);
      border-color: var(--color-text-muted);
    }
    .when-signed-out a {
      color: var(--color-accent);
      text-decoration: none;
      font-size: 0.8rem;
      padding: var(--space-xs) var(--space-sm);
      border: 1px solid var(--color-accent-dim);
      border-radius: var(--border-radius);
    }
    .when-signed-out a:hover {
      background-color: var(--color-accent-dim);
      color: var(--color-background-page);
    }
    @media (max-width: 900px) { .header-title { display: none; } }
    @media (max-width: 768px) { .header-nav { display: none; } }
    @media (max-width: 480px) {
      header { height: auto; padding: var(--space-sm) var(--space-md); flex-wrap: wrap; gap: var(--space-sm); }
      .user-name { display: none; }
    }
  `;
}
