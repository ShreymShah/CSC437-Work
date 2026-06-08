import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { fromHistory } from "@unbndl/switch";

export class AlgoHeaderElement extends HTMLElement {
  // Observe the current location from the history provider so the nav can
  // highlight the active page reactively as the user navigates the SPA.
  viewModel = createViewModel<{ location?: Location }>({
    location: undefined
  }).with(fromHistory(this), "location");

  constructor() {
    super();
    shadow(this)
      .styles(AlgoHeaderElement.styles)
      .replace(html`
        <header>
          <a href="/app" class="header-brand">
            <span class="brand-icon">▲</span>
            <span class="brand-name">AlgoTrader</span>
          </a>
          <nav class="header-nav">
            <a href="/app" data-match="/app">Home</a>
            <a href="/app/strategies" data-match="/app/strategies">Strategies</a>
          </nav>
          <nav class="header-user logged-out">
            <span class="user-name"></span>
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
      `)
      .delegate(".when-signed-in button", {
        click: () => this.signout()
      });

    // Re-evaluate which nav link is "current" whenever the location changes.
    this.viewModel.createEffect(($) => {
      this._updateActiveNav($.location?.pathname ?? window.location.pathname);
    });
  }

  connectedCallback() {
    this._updateActiveNav(window.location.pathname);
    const token = localStorage.getItem("un-auth:token");
    if (token) this._updateAuth(true, this._decodeUsername(token));
    this.addEventListener("auth:message", (ev: any) => {
      const [type, payload] = ev.detail || [];
      if (type === "auth/signin" && payload?.token) {
        this._updateAuth(true, this._decodeUsername(payload.token));
      } else if (type === "auth/signout") {
        this._updateAuth(false, undefined);
      }
    });
  }

  // Mark the nav link whose route matches the current path. Home matches only
  // the exact "/app" path; Strategies matches "/app/strategies" and any of its
  // sub-routes (detail / edit / new).
  _updateActiveNav(pathname: string) {
    const root = this.shadowRoot;
    if (!root) return;
    root.querySelectorAll(".header-nav a").forEach((el) => {
      const match = el.getAttribute("data-match") || "";
      const isActive =
        match === "/app"
          ? pathname === "/app"
          : pathname === match || pathname.startsWith(match + "/");
      el.classList.toggle("active", isActive);
      if (isActive) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });
  }

  _decodeUsername(token: string) {
    try { return JSON.parse(atob(token.split(".")[1])).username; }
    catch { return undefined; }
  }

  _updateAuth(authenticated: boolean, username: string | undefined) {
    const root = this.shadowRoot;
    if (!root) return;
    const nav = root.querySelector(".header-user");
    const span = root.querySelector(".user-name");
    if (nav) nav.className = authenticated ? "header-user logged-in" : "header-user logged-out";
    if (span) span.textContent = username || "";
  }

  signout() {
    this.dispatchEvent(
      new CustomEvent("auth:message", {
        bubbles: true, composed: true,
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
      min-height: 60px;
      border-bottom: 2px solid var(--color-border-accent);
    }
    .header-brand {
      display: flex; align-items: center; gap: var(--space-sm);
      font-weight: 700; font-size: 1.1rem;
      color: var(--color-accent); text-decoration: none;
    }
    .header-nav {
      flex: 1; display: flex; gap: var(--space-xs); align-items: center;
    }
    .header-nav a {
      color: var(--color-text-muted); text-decoration: none;
      font-size: 0.8rem; padding: var(--space-xs) var(--space-sm);
      border-radius: var(--border-radius);
    }
    .header-nav a:hover {
      color: var(--color-text-header);
      background-color: var(--color-background-surface);
    }
    .header-nav a.active {
      color: var(--color-accent);
      background-color: var(--color-background-surface);
      font-weight: 700;
    }
    .header-user {
      display: flex; align-items: center; gap: var(--space-sm);
      color: var(--color-text-muted); font-size: 0.8rem;
    }
    menu { list-style: none; margin: 0; padding: 0; display: flex; gap: var(--space-sm); }
    li { display: none; }
    .logged-in .when-signed-in,
    .logged-out .when-signed-out { display: list-item; }
    .signout-btn {
      background: none; border: 1px solid var(--color-border);
      color: var(--color-text-muted); border-radius: var(--border-radius);
      padding: var(--space-xs) var(--space-sm); font-size: 0.8rem; cursor: pointer;
    }
    .signout-btn:hover { color: var(--color-text-header); border-color: var(--color-text-muted); }
    .when-signed-out a {
      color: var(--color-accent); text-decoration: none; font-size: 0.8rem;
      padding: var(--space-xs) var(--space-sm);
      border: 1px solid var(--color-accent-dim); border-radius: var(--border-radius);
    }
    .when-signed-out a:hover {
      background-color: var(--color-accent-dim);
      color: var(--color-background-page);
    }

    /* Narrow screens: let the header wrap onto multiple rows instead of
       crowding the brand, nav, and user menu into a single 60px line. */
    @media (max-width: 540px) {
      header {
        flex-wrap: wrap;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
      }
      .header-brand { flex: 1 0 auto; }
      .header-nav {
        order: 3;
        flex: 1 0 100%;
        justify-content: flex-start;
      }
      .header-user { margin-left: auto; }
    }
  `;
}
