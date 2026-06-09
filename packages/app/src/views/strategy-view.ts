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

type StrategyMode = "view" | "edit" | "new";
type RowKind = "components" | "status";

interface StrategyViewModel {
  mode: StrategyMode;
  strategyId?: string;
  // The strategy as loaded from the store (used for the read-only view and to
  // seed the editable draft).
  strategy?: Strategy;
  // A working copy edited by the create/edit forms. Inputs bind to this so that
  // typed values survive the re-render triggered by adding/removing stat rows.
  draft?: Strategy;
}

export class StrategyViewElement extends HTMLElement {
  // Guards one-time seeding of the editable draft from the loaded strategy.
  private seeded = false;

  // The view model blends three sources:
  //  - `mode`/`strategyId` come from this element's attributes (set by the route)
  //  - `strategy` is observed from the shared store (the Model)
  //  - `draft` is local editable state we update as the user edits the form
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

  // Placeholder shown when a strategy has no components or no status, so the
  // section reads as intentionally empty rather than looking broken.
  emptyStatView = createView<{ label: string }>(html`
    <li class="stat-empty">${($) => $.label}</li>
  `);

  // A single editable stat row (label + value) used by both forms. Any extra
  // fields the row originally had (unit, href, …) are preserved through a
  // serialized `data-extra` attribute so editing doesn't silently drop them.
  rowView = createView<AlgoStat>(html`
    <div class="row" data-extra=${($) => this.extraJSON($)}>
      <input
        class="row-input"
        data-field="label"
        placeholder="Label"
        .value=${($) => $.label ?? ""}
      />
      <input
        class="row-input"
        data-field="value"
        placeholder="Value"
        .value=${($) => $.value ?? ""}
      />
      <button type="button" class="remove-row" title="Remove row" aria-label="Remove row">
        ✕
      </button>
    </div>
  `);

  // The ID field, shown only when creating a new strategy.
  idFieldView = createView<{ id: string }>(html`
    <label>
      <span>ID</span>
      <input
        name="id"
        required
        placeholder="e.g. btc-momentum"
        .value=${($) => $.id ?? ""}
      />
    </label>
  `);

  // Read-only presentation of a strategy.
  mainView = createView<Strategy>(html`
    <article class="card">
      <header class="card-header">
        <h1>${($) => $.name || "Unnamed Strategy"}</h1>
        <div class="header-actions">
          <a class="btn edit-link" href=${($) =>
            `/app/strategies/${$.id}/edit`}
            >Edit</a
          >
          <button type="button" class="btn delete-btn">Delete</button>
        </div>
      </header>
      <p class="description">${($) => $.description || ""}</p>
      <div class="stat-grid">
        <section>
          <h2>Components</h2>
          <ul class="stats">
            ${($) =>
              ($.components ?? []).length
                ? View.map(this.statView, $.components ?? [])
                : View.apply(this.emptyStatView, {
                    label: "No components yet."
                  })}
          </ul>
        </section>
        <section>
          <h2>Status</h2>
          <ul class="stats">
            ${($) =>
              ($.status ?? []).length
                ? View.map(this.statView, $.status ?? [])
                : View.apply(this.emptyStatView, {
                    label: "No status reported yet."
                  })}
          </ul>
        </section>
      </div>
    </article>
  `);

  // The editable form, shared by "edit" and "new" modes. The title, button
  // label, ID field, and Cancel target switch on `mode`. Stat rows are rendered
  // from the draft so add/remove re-renders keep every row's typed values.
  editView = createView<StrategyViewModel>(html`
    <form class="card">
      <h1>${($) => ($.mode === "new" ? "New Strategy" : "Edit Strategy")}</h1>
      ${($) =>
        $.mode === "new"
          ? View.apply(this.idFieldView, { id: $.draft?.id ?? "" })
          : ""}
      <label>
        <span>Name</span>
        <input name="name" .value=${($) => $.draft?.name ?? ""} />
      </label>
      <label>
        <span>Description</span>
        <textarea name="description" rows="4" .value=${($) =>
          $.draft?.description ?? ""}></textarea>
      </label>

      <section class="rows-section">
        <h2>Components</h2>
        <div class="rows" data-kind="components">
          ${($) => View.map(this.rowView, $.draft?.components ?? [])}
        </div>
        <button type="button" class="add-row" data-kind="components">
          + Add component
        </button>
      </section>

      <section class="rows-section">
        <h2>Status</h2>
        <div class="rows" data-kind="status">
          ${($) => View.map(this.rowView, $.draft?.status ?? [])}
        </div>
        <button type="button" class="add-row" data-kind="status">
          + Add status
        </button>
      </section>

      <div class="actions">
        <button type="submit">
          ${($) => ($.mode === "new" ? "Create" : "Save")}
        </button>
        <a
          class="btn cancel"
          href=${($) =>
            $.mode === "new"
              ? "/app/strategies"
              : `/app/strategies/${$.draft?.id ?? ""}`}
          >Cancel</a
        >
      </div>
    </form>
  `);

  // The top-level view: read-only card in "view" mode, otherwise the editable
  // form once the draft has been seeded.
  view = createView<StrategyViewModel>(html`
    <section class="strategy">
      ${($) =>
        $.mode === "view"
          ? $.strategy
            ? View.apply(this.mainView, $.strategy)
            : "Loading…"
          : $.draft
          ? View.apply(this.editView, $)
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
      })
      // Add/remove stat rows (delegated so dynamically-added rows work too).
      .delegate(".add-row", { click: (ev: Event) => this.onAddRow(ev) })
      .delegate(".remove-row", { click: (ev: Event) => this.onRemoveRow(ev) })
      // Delete the whole strategy (from the read-only detail view).
      .delegate(".delete-btn", { click: () => this.onDelete() });

    // Seed the editable draft exactly once: empty for "new", or a copy of the
    // loaded strategy for "edit" (which may arrive after an async fetch).
    this.viewModel.createEffect(($) => {
      if (this.seeded) return;
      if ($.mode === "new") {
        this.seeded = true;
        this.viewModel.update({
          draft: { id: "", name: "", description: "", components: [], status: [] }
        });
      } else if ($.mode === "edit" && $.strategy) {
        this.seeded = true;
        const s = $.strategy;
        this.viewModel.update({
          draft: {
            id: s.id,
            name: s.name ?? "",
            description: s.description ?? "",
            components: (s.components ?? []).map((r) => ({ ...r })),
            status: (s.status ?? []).map((r) => ({ ...r }))
          }
        });
      }
    });
  }

  connectedCallback() {
    const id = this.getAttribute("strategy-id");
    if (id) Store.dispatch(this, ["strategy/request", { id }] as Msg);
  }

  // Serialize the fields of a stat row other than label/value so they can be
  // preserved across edits. Returns "" when there's nothing extra to keep.
  private extraJSON(stat: AlgoStat): string {
    const { label, value, ...rest } = stat;
    const keys = Object.keys(rest).filter(
      (k) => (rest as Record<string, unknown>)[k] != null
    );
    return keys.length ? JSON.stringify(rest) : "";
  }

  // Delete the current strategy after confirmation, then return to the list.
  onDelete() {
    const id = this.viewModel.$.strategy?.id ?? this.viewModel.$.strategyId;
    if (!id) return;
    if (
      !window.confirm(
        "Delete this strategy? This action cannot be undone."
      )
    )
      return;

    Store.dispatch(this, [
      "strategy/delete",
      { id },
      {
        onSuccess: () =>
          BrowserHistory.dispatch(this, "history/navigate", {
            href: "/app/strategies"
          }),
        onFailure: (error: Error) => console.log("ERROR:", error)
      }
    ] as Msg);
  }

  onAddRow(ev: Event) {    const btn = (ev.target as HTMLElement).closest(".add-row");
    if (!btn) return;
    const kind = btn.getAttribute("data-kind") as RowKind;
    const draft = this.readDraft();
    draft[kind] = [...draft[kind], { label: "", value: "" }];
    this.viewModel.update({ draft });
  }

  onRemoveRow(ev: Event) {
    const btn = (ev.target as HTMLElement).closest(".remove-row");
    if (!btn) return;
    const row = btn.closest(".row");
    const container = btn.closest(".rows");
    if (!row || !container) return;
    const kind = container.getAttribute("data-kind") as RowKind;
    const index = Array.from(container.querySelectorAll(".row")).indexOf(row);
    const draft = this.readDraft();
    draft[kind].splice(index, 1);
    this.viewModel.update({ draft });
  }

  submitForm(ev: Event) {
    ev.preventDefault();

    const draft = this.readDraft();
    // Drop rows the user left completely blank.
    const clean = (rows: AlgoStat[]) =>
      rows.filter((r) => (r.label ?? "").trim() || (r.value ?? "").trim());
    draft.components = clean(draft.components);
    draft.status = clean(draft.status);

    if (this.viewModel.$.mode === "new") {
      const id = draft.id.trim();
      if (!id) return;
      const strategy = { ...draft, id } as Strategy;

      Store.dispatch(this, [
        "strategy/create",
        { strategy },
        {
          onSuccess: () =>
            BrowserHistory.dispatch(this, "history/navigate", {
              href: `/app/strategies/${id}`
            }),
          onFailure: (error: Error) => console.log("ERROR:", error)
        }
      ] as Msg);
      return;
    }

    // Editing: the id comes from the route attribute, not the form.
    const id = this.viewModel.$.strategyId;
    if (!id) return;
    const current = this.viewModel.$.strategy;

    // Merge edited fields over the current strategy and keep the id intact.
    const strategy = { ...(current ?? {}), ...draft, id } as Strategy;

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

  // Read the entire editable form back out of the DOM into a Strategy. The DOM
  // is the source of truth while editing, so this is called before any
  // structural change (add/remove row) and on submit.
  private readDraft(): Strategy {
    const root = this.shadowRoot;
    const getVal = (sel: string) =>
      (
        root?.querySelector(sel) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | null
      )?.value ?? "";

    const readRows = (kind: RowKind): AlgoStat[] => {
      const container = root?.querySelector(`.rows[data-kind="${kind}"]`);
      if (!container) return [];
      return Array.from(container.querySelectorAll(".row")).map((row) => {
        let extra: Partial<AlgoStat> = {};
        const raw = (row as HTMLElement).getAttribute("data-extra");
        if (raw) {
          try {
            extra = JSON.parse(raw);
          } catch {
            extra = {};
          }
        }
        return {
          ...extra,
          label:
            (row.querySelector('[data-field="label"]') as HTMLInputElement)
              ?.value ?? "",
          value:
            (row.querySelector('[data-field="value"]') as HTMLInputElement)
              ?.value ?? ""
        } as AlgoStat;
      });
    };

    const mode = this.viewModel.$.mode;
    const id =
      mode === "new"
        ? getVal('input[name="id"]')
        : this.viewModel.$.draft?.id ?? this.viewModel.$.strategyId ?? "";

    return {
      id,
      name: getVal('input[name="name"]'),
      description: getVal('textarea[name="description"]'),
      components: readRows("components"),
      status: readRows("status")
    };
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
    .stat-empty {
      color: var(--color-text-muted);
      font-size: 0.875rem;
      font-style: italic;
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
    .rows-section {
      margin-bottom: var(--space-lg);
    }
    .rows {
      display: grid;
      gap: var(--space-sm);
      margin-bottom: var(--space-sm);
    }
    .row {
      display: flex;
      gap: var(--space-sm);
      align-items: center;
    }
    .row .row-input {
      flex: 1;
    }
    .remove-row {
      flex: 0 0 auto;
      background: none;
      border: 1px solid var(--color-border);
      color: var(--color-text-muted);
      border-radius: var(--border-radius);
      padding: var(--space-xs) var(--space-sm);
      cursor: pointer;
      line-height: 1;
    }
    .remove-row:hover {
      color: rgb(220 60 60);
      border-color: rgb(220 60 60);
    }
    .add-row {
      background: none;
      border: 1px dashed var(--color-border);
      color: var(--color-text-muted);
      border-radius: var(--border-radius);
      padding: var(--space-xs) var(--space-md);
      font-size: 0.8rem;
      cursor: pointer;
    }
    .add-row:hover {
      color: var(--color-accent);
      border-color: var(--color-accent-dim);
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
    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }
    .delete-btn {
      border-color: rgb(150 50 50);
      color: rgb(220 90 90);
    }
    .delete-btn:hover {
      background-color: rgb(220 60 60);
      border-color: rgb(220 60 60);
      color: var(--color-background-page);
    }
  `;
}
