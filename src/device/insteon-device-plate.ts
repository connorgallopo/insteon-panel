import type { CSSResultGroup, TemplateResult } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators";
import { fireEvent } from "@ha/common/dom/fire_event";
import type { PlateLayout } from "./plate-layout";
import { plateLayout } from "./plate-layout";

declare global {
  interface HASSDomEvents {
    "insteon-button-selected": { group: number };
  }
}

@customElement("insteon-device-plate")
export class InsteonDevicePlate extends LitElement {
  @property({ type: Number }) public cat?: number | null;

  @property({ type: Number }) public subcat?: number | null;

  @property({ type: Number }) public selected?: number;

  @property({ type: Number }) public loadGroup?: number;

  protected render(): TemplateResult | typeof nothing {
    const layout = plateLayout(this.cat, this.subcat);
    switch (layout) {
      case "paddle_dimmer":
      case "paddle_relay":
      case "paddle_i3":
        return this._renderPaddle(layout);
      case "keypad_i3_4":
        return this._renderKeypadI3();
      case "keypad_6":
        return this._renderKeypad6();
      case "keypad_8":
        return this._renderKeypad8();
      case "dial_i3":
        return this._renderDial();
      case "outlet_dual":
        return this._renderOutlet(true);
      case "outlet_dimmer":
        return this._renderOutlet(false);
      case "module":
        return this._renderModule();
      default:
        return nothing;
    }
  }

  private _select(group: number) {
    fireEvent(this, "insteon-button-selected", { group });
  }

  private _key(group: number, content: TemplateResult | string, extraClass = ""): TemplateResult {
    const isKeypad = ["krow", "wide"].includes(extraClass) || extraClass === "";
    const showLoad = isKeypad && this.loadGroup !== undefined && this.loadGroup === group;
    return html`
      <div
        class="key ${extraClass} ${this.selected === group ? "selected" : ""}"
        role="button"
        tabindex="0"
        @click=${() => this._select(group)}
        @keydown=${(ev: KeyboardEvent) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            this._select(group);
          }
        }}
      >
        ${content} ${showLoad ? html`<span class="load-tag">LOAD</span>` : nothing}
      </div>
    `;
  }

  private _renderPaddle(layout: PlateLayout): TemplateResult {
    return html`
      <div class="plate">
        <div class="paddle-zone">
          ${layout === "paddle_dimmer"
            ? html`<div class="ledcol">
                ${[...Array(8)].map(() => html`<span class="led"></span>`)}
              </div>`
            : nothing}
          ${this._key(
            1,
            html`
              ${layout === "paddle_relay"
                ? html`<span class="led pos-top-left"></span><span class="led pos-mid-left"></span>`
                : nothing}
              ${layout === "paddle_i3" ? html`<span class="led pos-crease"></span>` : nothing}
            `,
            "paddle",
          )}
        </div>
        <div class="airgap"></div>
      </div>
    `;
  }

  private _renderKeypadI3(): TemplateResult {
    const letters = ["A", "B", "C", "D"];
    return html`
      <div class="plate">
        <div class="kp-insert">
          ${letters.map((letter, idx) =>
            this._key(idx + 1, html`${letter}<span class="led pos-row-right"></span>`, "krow"),
          )}
          <div class="kp-foot"><span class="slot"></span></div>
        </div>
      </div>
    `;
  }

  private _renderKeypad6(): TemplateResult {
    return html`
      <div class="plate">
        <div class="kp-frame">
          <div class="kgrid">
            ${this._key(1, html`ON`, "wide")} ${this._key(3, html`A`)} ${this._key(4, html`B`)}
            ${this._key(5, html`C`)} ${this._key(6, html`D`)} ${this._key(1, html`OFF`, "wide")}
          </div>
        </div>
        <div class="airgap"></div>
      </div>
    `;
  }

  private _renderKeypad8(): TemplateResult {
    const letters = ["B", "C", "D", "E", "F", "G", "H"];
    return html`
      <div class="plate">
        <div class="kp-frame">
          <div class="kgrid">
            ${this._key(1, html`<span class="small-label">MAIN<br />On/Off</span>`)}
            ${letters.map((letter, idx) => this._key(idx + 2, html`${letter}`))}
          </div>
        </div>
        <div class="airgap"></div>
      </div>
    `;
  }

  private _renderDial(): TemplateResult {
    return html`
      <div class="plate">
        <div class="dial-insert">${this._key(1, html`<span class="knob"></span>`, "dial")}</div>
      </div>
    `;
  }

  private _renderOutlet(dual: boolean): TemplateResult {
    return html`
      <div class="plate">
        <div class="outlet-insert">
          ${this._key(1, this._receptacle(), "recep")}
          ${dual
            ? html`
                <div class="outctl"><span class="led grn"></span><span class="pill"></span></div>
                <div class="outctl"><span class="led"></span><span class="pill"></span></div>
              `
            : html`<div class="outctl">
                <span class="pill"></span><span class="led grn"></span>
              </div>`}
          ${dual
            ? this._key(2, this._receptacle(), "recep")
            : html`<div class="key recep static">${this._receptacle()}</div>`}
        </div>
      </div>
    `;
  }

  private _receptacle(): TemplateResult {
    return html`<span class="slots"></span><span class="ground"></span>`;
  }

  private _renderModule(): TemplateResult {
    return html`
      <div class="module-body">
        ${this._key(
          1,
          html`
            <span class="led grn pos-module"></span>
            <span class="lines"><i></i><i></i><i></i></span>
            <span class="terms"><i></i><i></i><i></i><i></i></span>
          `,
          "module",
        )}
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: inline-block;
        --plate-bg: linear-gradient(175deg, #fbfaf8, #f0eeea);
        --plate-edge: #dcd9d2;
        --key-face: #fdfcfa;
        --key-edge: #d9d5cc;
        --key-down: #f1eee7;
        --key-text: #4a463e;
        --slot-color: #5b574e;
        --led-off: #cfccc4;
        --led-grn: #4caf50;
      }

      .plate {
        background: var(--plate-bg);
        border: 1px solid var(--plate-edge);
        border-radius: 12px;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.7),
          0 2px 6px rgba(0, 0, 0, 0.15);
        padding: 18px 22px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .key {
        background: var(--key-face);
        border: 1px solid var(--key-edge);
        color: var(--key-text);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        -webkit-user-select: none;
      }

      .key:hover {
        background: var(--key-down);
      }

      .key:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 1px;
      }

      .key.selected {
        outline: 3px solid var(--primary-color);
        outline-offset: 2px;
        z-index: 1;
      }

      .key.static {
        cursor: default;
        pointer-events: none;
      }

      .led {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--led-off);
        flex: 0 0 auto;
      }

      .led.grn {
        background: var(--led-grn);
        box-shadow: 0 0 4px var(--led-grn);
      }

      .load-tag {
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: var(--primary-color);
        margin-left: 6px;
      }

      .airgap {
        width: 34px;
        height: 5px;
        margin-top: 10px;
        background: var(--key-down);
        border: 1px solid var(--key-edge);
        border-radius: 2px;
      }

      /* paddles */
      .paddle-zone {
        display: flex;
        gap: 7px;
        align-items: center;
      }

      .paddle {
        width: 62px;
        height: 126px;
        border-radius: 6px;
      }

      .ledcol {
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-self: flex-start;
        margin-top: 9px;
      }

      .ledcol .led {
        width: 5px;
        height: 5px;
      }

      .pos-top-left {
        position: absolute;
        top: 11px;
        left: 6px;
      }

      .pos-mid-left {
        position: absolute;
        top: 44%;
        left: 6px;
      }

      .pos-crease {
        position: absolute;
        top: 50%;
        left: 4px;
        transform: translateY(-50%);
      }

      /* i3 keypad */
      .kp-insert {
        width: 96px;
        background: var(--key-face);
        border: 1px solid var(--key-edge);
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .krow {
        height: 44px;
        border: none;
        border-bottom: 1px solid var(--key-edge);
        border-radius: 0;
        justify-content: flex-start;
        padding: 0 12px;
      }

      .krow.selected {
        outline: none;
        box-shadow: inset 0 0 0 3px var(--primary-color);
      }

      .pos-row-right {
        position: absolute;
        top: 8px;
        right: 8px;
      }

      .kp-foot {
        height: 11px;
        position: relative;
      }

      .kp-foot .slot {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        bottom: 3px;
        width: 34px;
        height: 4px;
        border-radius: 2px;
        background: var(--key-down);
        border: 1px solid var(--key-edge);
      }

      /* keyed keypads */
      .kp-frame {
        background: var(--key-face);
        border: 1px solid var(--key-edge);
        border-radius: 8px;
        padding: 5px;
      }

      .kgrid {
        display: grid;
        grid-template-columns: repeat(2, 42px);
        gap: 4px;
      }

      .kgrid .key {
        height: 30px;
        border-radius: 4px;
        font-size: 12px;
      }

      .kgrid .key.wide {
        grid-column: span 2;
        height: 32px;
      }

      .small-label {
        font-size: 8.5px;
        font-weight: 700;
        text-align: center;
        line-height: 1.15;
      }

      /* dial */
      .dial-insert {
        width: 74px;
        height: 128px;
        background: var(--key-face);
        border: 1px solid var(--key-edge);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .key.dial {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: linear-gradient(160deg, #ffffff, #e8e5de);
        box-shadow:
          0 3px 6px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.9);
      }

      /* outlets */
      .outlet-insert {
        width: 74px;
        background: var(--key-face);
        border: 1px solid var(--key-edge);
        border-radius: 8px;
        padding: 9px 7px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 7px;
      }

      .key.recep {
        width: 52px;
        height: 46px;
        border-radius: 8px;
      }

      .slots {
        position: absolute;
        top: 9px;
        left: 12px;
        right: 12px;
        height: 16px;
      }

      .slots::before,
      .slots::after {
        content: "";
        position: absolute;
        top: 0;
        width: 4px;
        height: 13px;
        background: var(--slot-color);
        border-radius: 1px;
      }

      .slots::before {
        left: 0;
      }

      .slots::after {
        right: 0;
        height: 16px;
      }

      .ground {
        position: absolute;
        bottom: 6px;
        left: 50%;
        transform: translateX(-50%);
        width: 10px;
        height: 12px;
        background: var(--slot-color);
        border-radius: 50% 50% 3px 3px;
      }

      .outctl {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .pill {
        width: 22px;
        height: 10px;
        border-radius: 6px;
        background: var(--key-face);
        border: 1px solid var(--key-edge);
      }

      /* module */
      .module-body {
        padding: 4px;
      }

      .key.module {
        width: 108px;
        height: 108px;
        border-radius: 10px;
        clip-path: polygon(12% 0, 88% 0, 100% 12%, 100% 88%, 88% 100%, 12% 100%, 0 88%, 0 12%);
      }

      .pos-module {
        position: absolute;
        top: 13px;
        left: 16px;
      }

      .lines {
        position: absolute;
        top: 30px;
        left: 16px;
        width: 26px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        border-left: 2px solid var(--slot-color);
        padding-left: 0;
      }

      .lines i {
        display: block;
        height: 2px;
        background: var(--slot-color);
      }

      .terms {
        position: absolute;
        top: 22px;
        right: 13px;
        display: flex;
        flex-direction: column;
        gap: 7px;
      }

      .terms i {
        display: block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #b9b5ac;
        border: 1px solid #a19d94;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "insteon-device-plate": InsteonDevicePlate;
  }
}
