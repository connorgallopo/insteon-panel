import type { CSSResultGroup, SVGTemplateResult, TemplateResult } from "lit";
import { css, html, LitElement, nothing, svg } from "lit";
import { customElement, property } from "lit/decorators";
import { fireEvent } from "@ha/common/dom/fire_event";
import type { PlateLayout } from "./plate-layout";
import { plateGroups, plateLayout } from "./plate-layout";

declare global {
  interface HASSDomEvents {
    "insteon-button-selected": { group: number };
  }
}

const led = (cx: number, cy: number, r: number, cls = ""): SVGTemplateResult =>
  svg`<circle class="led ${cls}" cx=${cx} cy=${cy} r=${r}></circle>`;

const tab = (x: number, y: number, w: number, h: number, cls = ""): SVGTemplateResult =>
  svg`<rect class="tab ${cls}" x=${x} y=${y} width=${w} height=${h} rx=${h / 2}></rect>`;

const BAR_LED_Y = [11, 18, 26.3, 34.6, 42.9, 51.2, 59.5, 67.8, 78.6];

@customElement("insteon-device-plate")
export class InsteonDevicePlate extends LitElement {
  @property({ type: Number }) public cat?: number | null;

  @property({ type: Number }) public subcat?: number | null;

  @property({ type: Number }) public selected?: number;

  @property({ attribute: false }) public names: Record<number, string> = {};

  @property() public loadCaption?: string;

  private get _layout(): PlateLayout {
    return plateLayout(this.cat, this.subcat);
  }

  protected render(): TemplateResult | typeof nothing {
    const renderers: Partial<Record<PlateLayout, () => TemplateResult>> = {
      paddle_bar: () => this._wall(this._paddleBar()),
      paddle_pair: () => this._wall(this._paddlePair()),
      paddle_i3: () => this._wall(this._paddleI3()),
      keypad_i3_4: () => this._wall(this._keypadI3()),
    };
    const draw = renderers[this._layout];
    return draw ? draw() : nothing;
  }

  private _wall(content: SVGTemplateResult): TemplateResult {
    return html`
      <div class="plate">
        <svg class="insert" viewBox="0 0 80 160">${content}</svg>
      </div>
      ${this.loadCaption ? html`<div class="caption">${this.loadCaption}</div>` : nothing}
    `;
  }

  private _select(group: number) {
    fireEvent(this, "insteon-button-selected", { group });
  }

  private _key(group: number, shape: SVGTemplateResult, cls = ""): SVGTemplateResult {
    const multi = plateGroups(this._layout).length > 1;
    const selected = multi && this.selected === group;
    const name = this.names[group] ?? String(group);
    return svg`
      <g
        class="key ${cls} ${selected ? "selected" : ""}"
        role="button"
        tabindex="0"
        aria-label=${name}
        aria-pressed=${selected ? "true" : "false"}
        @click=${() => this._select(group)}
        @keydown=${(ev: KeyboardEvent) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            this._select(group);
          }
        }}
      >
        <title>${name}</title>
        ${shape}
      </g>
    `;
  }

  private _switchlinc(indicators: SVGTemplateResult): SVGTemplateResult {
    const dark = this.subcat === 0x24;
    return svg`
      <rect class="bezel" x="0.5" y="0.5" width="79" height="159" rx="2"></rect>
      ${indicators}
      ${this._key(
        1,
        svg`
          <rect class="face" x="8" y="8" width="64" height="143" rx="3"></rect>
          <rect class="lower" x="8" y="79.5" width="64" height="71.5" rx="3"></rect>
        `,
      )}
      ${tab(34, 152, 12, 5, dark ? "dark" : "")}
    `;
  }

  private _paddleBar(): SVGTemplateResult {
    return this._switchlinc(svg`${BAR_LED_Y.map((y) => led(4, y, 2))}`);
  }

  private _paddlePair(): SVGTemplateResult {
    return this._switchlinc(svg`${led(4, 10, 2)}${led(4, 78, 2)}`);
  }

  private _paddleI3(): SVGTemplateResult {
    return svg`
      <defs>
        <linearGradient id="i3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f4f4f4"></stop>
          <stop offset="1" stop-color="#fbfbfb"></stop>
        </linearGradient>
      </defs>
      ${this._key(
        1,
        svg`<rect class="face i3" x="0.5" y="0.5" width="79" height="159" rx="3"></rect>`,
      )}
      ${led(8, 78.4, 1.2)}
      <rect class="slot lip" x="26.5" y="154.5" width="27" height="2.5" rx="1.25"></rect>
    `;
  }

  private _keypadI3(): SVGTemplateResult {
    const rows = [0, 1, 2, 3];
    return svg`
      <rect class="frame" x="0.5" y="0.5" width="79" height="159" rx="3"></rect>
      ${rows.map((i) =>
        this._key(
          i + 1,
          svg`<rect class="face row" x="1.5" y=${i * 40 + 1.5} width="77" height="38"></rect>`,
        ),
      )}
      ${[40, 80, 120].map((y) => svg`<line class="hair" x1="1" y1=${y} x2="79" y2=${y}></line>`)}
      ${rows.map((i) => led(70.4, i * 40 + 9.2, 1))}
      <rect class="slot lip" x="27" y="155.5" width="26" height="2.5" rx="1.25"></rect>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        --plate-face: #f7f7f7;
        --plate-edge: #d9d9d9;
        --key-face: #fdfdfd;
        --key-hover: #f0f0f0;
        --key-edge: #c4c4c4;
        --hairline: #d6d6d6;
        --slot: #4a4a4a;
        --print: #8a8a8a;
        --led-ring: #9a9a9a;
        --tab: #ffffff;
        --tab-dark: #222222;
      }

      .plate {
        background: var(--plate-face);
        border: 1px solid var(--plate-edge);
        border-radius: 3px;
        padding: calc(20px * var(--plate-scale, 1)) calc(21px * var(--plate-scale, 1));
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
      }

      .insert {
        display: block;
        width: calc(80px * var(--plate-scale, 1));
        height: calc(160px * var(--plate-scale, 1));
      }

      .body {
        display: block;
      }

      .caption {
        font-size: 11px;
        color: var(--secondary-text-color, #6b6b6b);
      }

      .bezel,
      .frame {
        fill: var(--key-face);
        stroke: var(--key-edge);
        stroke-width: 1;
      }

      .face {
        fill: var(--key-face);
        stroke: var(--key-edge);
        stroke-width: 1;
      }

      .lower {
        fill: rgba(0, 0, 0, 0.03);
        stroke: none;
        pointer-events: none;
      }

      .key {
        cursor: pointer;
        outline: none;
      }

      .key:hover .face {
        fill: var(--key-hover);
      }

      .key.selected .face,
      .key:focus-visible .face {
        stroke: var(--primary-color);
        stroke-width: 1.5;
      }

      .led {
        fill: none;
        stroke: var(--led-ring);
        stroke-width: 0.8;
        pointer-events: none;
      }

      .tab {
        fill: var(--tab);
        stroke: var(--key-edge);
        stroke-width: 0.6;
      }

      .tab.dark {
        fill: var(--tab-dark);
        stroke: none;
      }

      .slot {
        fill: var(--slot);
        pointer-events: none;
      }

      .print {
        fill: var(--print);
        font-family: var(--ha-font-family-body, sans-serif);
        text-anchor: middle;
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
      }

      .print.bold {
        font-weight: 700;
      }

      .face.row {
        stroke: none;
      }

      .key.selected .face.row,
      .key:focus-visible .face.row {
        stroke: var(--primary-color);
        stroke-width: 1.5;
      }

      .face.i3 {
        fill: url(#i3);
        stroke: var(--hairline);
      }

      .key:hover .face.i3 {
        fill: var(--key-hover);
      }

      .hair {
        stroke: var(--hairline);
        stroke-width: 0.8;
        pointer-events: none;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "insteon-device-plate": InsteonDevicePlate;
  }
}
