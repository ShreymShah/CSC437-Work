import { html, css, shadow } from "@unbndl/html";

function renderStat(stat) {
  const el = document.createElement("algo-stat");
  el.setAttribute("label", stat.label);
  if (stat.href) el.setAttribute("href", stat.href);
  if (stat.unit) el.setAttribute("unit", stat.unit);
  if (stat.status) el.setAttribute("status", stat.status);
  el.textContent = stat.value;
  return el;
}

export class AlgoStrategyElement extends HTMLElement {
  constructor() {
    super();
    shadow(this).styles(AlgoStrategyElement.styles);
  }

  static observedAttributes = ["src"];

  attributeChangedCallback(name, _, newValue) {
    if (name === "src") {
      this.hydrate(newValue).then((data) => {
        if (data) shadow(this).replace(AlgoStrategyElement.render(data));
      });
    }
  }

  get authorization() {
    const token = localStorage.getItem("un-auth:token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  static render(data) {
    const item = Array.isArray(data) ? data[0] : data;
    const components = item?.components || [];
    const status = item?.status || [];
    return html`
      <div class="card-grid">
        <section>
          <h2>Strategy Components</h2>
          <ul>
            ${components.map(renderStat)}
          </ul>
        </section>
        <section>
          <h2>Strategy Status</h2>
          <ul>
            ${status.map(renderStat)}
          </ul>
        </section>
      </div>
    `;
  }

  hydrate(src) {
    return fetch(src, { headers: this.authorization })
      .then((response) => {
        if (response.status !== 200)
          throw `HTTP Status ${response.status}`;
        return response.json();
      })
      .catch((error) => {
        console.log(`Could not fetch ${src}:`, error);
        return null;
      });
  }

  static styles = css`
    :host {
      display: block;
      margin-top: var(--space-lg);
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: var(--space-lg);
    }
    section {
      background-color: var(--color-background-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      padding: var(--space-md) var(--space-lg);
    }
    h2 {
      color: var(--color-text-header);
      border-bottom: 1px solid var(--color-border);
      padding-bottom: var(--space-xs);
      margin-bottom: var(--space-md);
      font-size: 1rem;
    }
    ul {
      padding-left: var(--space-lg);
    }
    @media (max-width: 480px) {
      .card-grid { grid-template-columns: 1fr; }
    }
  `;
}
