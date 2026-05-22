import { define, css, html, shadow } from "@unbndl/html";
import { Auth } from "@unbndl/auth";

class LoginFormElement extends HTMLElement {
  static styles = css`
    form { display: flex; flex-direction: column; gap: var(--space-md); }
    .error { margin: 0; font-size: 0.875rem; color: rgb(220 60 60); }
    .error:empty { display: none; }
    button {
      align-self: flex-start;
      background-color: var(--color-accent);
      color: var(--color-background-page);
      border: none; border-radius: var(--border-radius);
      padding: var(--space-sm) var(--space-lg);
      font-size: 1rem; font-weight: 700; cursor: pointer;
    }
    button:hover { opacity: 0.85; }
  `;

  constructor() {
    super();
    shadow(this)
      .styles(LoginFormElement.styles)
      .replace(html`
        <form>
          <slot></slot>
          <p class="error"></p>
          <button type="submit"><slot name="submit-label">Login</slot></button>
        </form>
      `)
      .listen({ submit: (ev: Event) => this.submitLogin(ev, this.getAttribute("api") || "#") });
  }

  submitLogin(event: Event, endpoint: string) {
    event.preventDefault();
    const errorEl = this.shadowRoot?.querySelector(".error");
    if (errorEl) errorEl.textContent = "";
    const username = (this.querySelector('input[name="username"]') as HTMLInputElement)?.value || "";
    const password = (this.querySelector('input[name="password"]') as HTMLInputElement)?.value || "";

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 409) throw "Username is already taken";
          if (res.status === 401) throw "Invalid username or password";
          throw `Request failed (${res.status})`;
        }
        return res.json();
      })
      .then(({ token }) => {
        this.dispatchEvent(
          new CustomEvent("auth:message", {
            bubbles: true, composed: true,
            detail: ["auth/signin", { token, redirect: "/app" }]
          })
        );
      })
      .catch(err => {
        if (errorEl) errorEl.textContent = typeof err === "string" ? err : "Something went wrong";
      });
  }
}

define({
  "auth-provider": Auth.Provider,
  "login-form": LoginFormElement
});
