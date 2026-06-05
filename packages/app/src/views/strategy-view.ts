import { css, html, shadow } from "@unbndl/html";
import {
  createView,
  createViewModel,
  fromAttributes,
  View
} from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { BrowserHistory } from "@unbndl/switch";
import { AlgoStat, Strategy } from "server/models";
import { Msg } from "../messages.ts";
import { Model } from "../model.ts";

type StrategyMode = "view" | "edit";

interface StrategyViewModel {
  mode: StrategyMode;
  strategyId?: string;
  strategy?: Strategy;
}

export class StrategyViewElement extends HTMLElement {
  // The view model blends three sources:
  //  - `mode`/`strategyId` come from this element's attributes (set by the route)
  //  - `strategy` is observed from the shared store (the Model)
  viewModel = createViewModel<StrategyViewModel>({
    mode: "view" as StrategyMode
  })
    .withRenamed(
      fromAttributes<{ "strategy-id": string; mode: StrategyMode }>(this),
      {
        strategyId: "strategy-id",
        mode: "mode"
      }
    )
    .with(fromStore<Model>(this), "strategy");

  // A single read-only stat row, reused for both components and status.
  statView = createView<AlgoStat>(html`
    <li class="stat">
      <span class="stat-label">${($) => $.label}</span>
      <span class="stat-value"
        >${($) => $.value ?? ""}${($) => $.unit ?? ""}</span
      >
    </li>
  `);

  // Read-only presentation of a strategy.
  mainView = createView<Strategy>(html`
    <article class="card">
      <header class="card-header">
        <h1>${($) => $.name || "Unnamed Strategy"}</h1>
        <a class="btn edit-link" href=${($) => `/app/strategies/${$.id}/edit`}
          >Edit</a
        >
      </header>
      <p class="description">${($) => $.description || ""}</p>
      <div class="stat-grid">
        <section>
          <h2>Components</h2>
          <ul class="stats">
            ${($) => View.map(this.statView, $.components ?? [])}
          </ul>
        </section>
        <section>
          <h2>Status</h2>
          <ul class="stats">
            ${($) => View.map(this.statView, $.status ?? [])}
          </ul>
        </section>
      </div>
    </article>
  `);

  // The editable form. Each <input>/<textarea> has a name= matching a
  // Strategy property so formDataToJSON can rebuild the object on submit.
  editView = createView<Strategy>(html`
    <form class="card">
      <h1>Edit Strategy</h1>
      <label>
        <span>Name</span>
        <input name="name" .value=${($) => $.name ?? ""} />
      </label>
      <label>
        <span>Description</span>
        <textarea name="description" rows="4" .value=${($) =>
          $.description ?? ""}></textarea>
      </label>
      <div class="actions">
        <button type="submit">Save</button>
        <a class="btn cancel" href=${($) => `/app/strategies/${$.id}`}
          >Cancel</a
        >
      </div>
    </form>
  `);

  // The top-level view: pick the editor or the read-only card, or show a
  // loading message until the store has the strategy.
  view = createView<StrategyViewModel>(html`
    <section class="strategy">
      ${($) =>
        $.strategy
          ? View.apply(
              $.mode === "edit" ? this.editView : this.mainView,
              $.strategy
            )
          : "Loading…"}
    </section>
  `);

  constructor() {
    super();
    shadow(this)
      .styles(StrategyViewElement.styles)
      .replace(this.viewModel.render(this.view))
      // Take over the browser's default form submission.
      .listen({
        submit: (ev: Event) => this.submitForm(ev)
      });
  }

  connectedCallback() {
    const id = this.getAttribute("strategy-id");
    if (id) Store.dispatch(this, ["strategy/request", { id }] as Msg);
  }

  submitForm(ev: Event) {
    ev.preventDefault();

    const form = ev.target as HTMLFormElement;
    const json = this.formDataToJSON(form);
    const id = this.viewModel.$.strategyId;
    const current = this.viewModel.$.strategy;

    if (!id) return;

    // Merge the edited fields over the current strategy so nested data
    // (components/status) is preserved, and keep the id intact.
    const strategy = { ...(current ?? {}), ...json, id } as Strategy;

    Store.dispatch(this, [
      "strategy/save",
      { id, strategy },
      {
        onSuccess: () =>
          BrowserHistory.dispatch(this, "history/navigate", {
            href: `/app/strategies/${id}`
          }),
        onFailure: (error: Error) => console.log("ERROR:", error)
      }
    ] as Msg);
  }

  // Collect [name, value] pairs from every named form control and turn them
  // into a plain object whose keys match the Strategy interface.
  formDataToJSON(form: HTMLFormElement): Record<string, string> {
    const inputs = Array.from(form.elements).filter(
      (el) => "name" in el && (el as HTMLInputElement).name !== ""
    ) as Array<HTMLInputElement>;

    const entries = inputs.map((el) => [el.name, el.value] as const);
    return Object.fromEntries(entries);
  }

  static styles = css`
    :host {
      display: block;
      padding: var(--space-xl);
    }
    .card {
      background-color: var(--color-background-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      padding: var(--space-lg) var(--space-xl);
      max-width: 720px;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-md);
      margin-bottom: var(--space-md);
    }
    h1 {
      color: var(--color-text-header);
      margin: 0 0 var(--space-md);
      font-size: 1.25rem;
    }
    .card-header h1 {
      margin: 0;
    }
    h2 {
      color: var(--color-text-header);
      font-size: 0.95rem;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: var(--space-xs);
      margin: 0 0 var(--space-sm);
    }
    .description {
      color: var(--color-text-muted);
      margin: 0 0 var(--space-lg);
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--space-lg);
    }
    .stats {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: var(--space-xs);
    }
    .stat {
      display: flex;
      justify-content: space-between;
      gap: var(--space-md);
      font-size: 0.875rem;
    }
    .stat-label {
      color: var(--color-text-muted);
    }
    .stat-value {
      color: var(--color-text);
      font-weight: 700;
    }
    .empty {
      color: var(--color-text-muted);
    }
    label {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
      margin-bottom: var(--space-md);
      color: var(--color-text-muted);
      font-size: 0.875rem;
    }
    input,
    textarea {
      background-color: var(--color-background-page);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      color: var(--color-text);
      padding: var(--space-sm) var(--space-md);
      font: inherit;
      width: 100%;
      box-sizing: border-box;
    }
    input:focus,
    textarea:focus {
      outline: none;
      border-color: var(--color-accent);
    }
    .actions {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      margin-top: var(--space-md);
    }
    button,
    .btn {
      display: inline-flex;
      align-items: center;
      border-radius: var(--border-radius);
      padding: var(--space-sm) var(--space-lg);
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
    }
    button[type="submit"] {
      background-color: var(--color-accent);
      color: var(--color-background-page);
      border: none;
    }
    button[type="submit"]:hover {
      opacity: 0.85;
    }
    .btn {
      background: none;
      border: 1px solid var(--color-border);
      color: var(--color-text-muted);
    }
    .btn:hover {
      color: var(--color-text-header);
      border-color: var(--color-text-muted);
    }
    .edit-link {
      border-color: var(--color-accent-dim);
      color: var(--color-accent);
    }
    .edit-link:hover {
      background-color: var(--color-accent-dim);
      color: var(--color-background-page);
    }
  `;
}
