import { html, css, shadow } from "@unbndl/html";
import reset from "./styles/reset.css.js";

export class AlgoStatElement extends HTMLElement {
  static template = html`
    <template>
      <strong id="label-el"></strong>: <a id="link-el"><slot></slot></a><span id="unit-el" class="unit"></span>
    </template>
  `;

  constructor() {
    super();
    shadow(this)
      .template(AlgoStatElement.template)
      .styles(reset.styles, AlgoStatElement.styles);
  }

  static observedAttributes = ["label", "href", "unit", "status"];

  attributeChangedCallback(name, _, newValue) {
    const root = this.shadowRoot;
    switch (name) {
      case "label":
        root.getElementById("label-el").textContent = newValue ?? "";
        break;
      case "href": {
        const link = root.getElementById("link-el");
        if (newValue) {
          link.setAttribute("href", newValue);
        } else {
          link.removeAttribute("href");
        }
        break;
      }
      case "unit":
        root.getElementById("unit-el").textContent = newValue ?? "";
        break;
      case "status":
        break;
    }
  }

  static styles = css`
    :host {
      display: list-item;
    }
    a {
      color: var(--color-link);
    }
    a:hover {
      color: var(--color-link-hover);
    }
    a:not([href]) {
      color: inherit;
      text-decoration: none;
      cursor: default;
      pointer-events: none;
    }
    .unit {
      color: var(--color-text-muted);
      font-size: 0.85em;
      margin-left: 0.1em;
    }
  `;
}
