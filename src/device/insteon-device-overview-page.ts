import type { CSSResultGroup, TemplateResult, PropertyValues } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import type { HomeAssistant, Route } from "@ha/types";
import "@ha/components/ha-card";
import "@ha/layouts/hass-tabs-subpage";
import { navigate } from "@ha/common/navigate";
import { showAlertDialog } from "@ha/dialogs/generic/show-dialog-box";
import { haStyle } from "@ha/resources/styles";
import { insteonDeviceTabs } from "./insteon-device-router";
import type { Insteon, InsteonDevice } from "../data/insteon";
import { fetchInsteonDevice } from "../data/device";

@customElement("insteon-device-overview-page")
class InsteonDeviceOverviewPage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public insteon!: Insteon;

  @property({ type: Boolean, reflect: true }) public narrow!: boolean;

  @property({ type: Boolean }) public isWide?: boolean;

  @property({ type: Object }) public route?: Route;

  @property() private deviceId?: string;

  @state() private _device?: InsteonDevice;

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    if (this.deviceId && this.hass) {
      fetchInsteonDevice(this.hass, this.deviceId).then(
        (device) => {
          this._device = device;
        },
        () => {
          showAlertDialog(this, {
            text: this.insteon.localize("common.error.device_not_found"),
          });
          navigate("/insteon/devices");
        },
      );
    }
  }

  protected render(): TemplateResult {
    return html`
      <hass-tabs-subpage
        .hass=${this.hass}
        .narrow=${this.narrow!}
        .route=${this.route!}
        .tabs=${insteonDeviceTabs}
        .localizeFunc=${this.insteon.localize}
        .backCallback=${this._handleBackTapped}
      >
        ${this.narrow
          ? html`<div slot="header" class="narrow-header">${this._device?.name}</div>`
          : ""}
        <div class="container">
          ${!this.narrow
            ? html`
                <div class="page-header">
                  <h1>${this._device?.name}</h1>
                  <div class="logo">
                    <img
                      src="https://brands.home-assistant.io/insteon/logo.png"
                      alt="Insteon Logo"
                      referrerpolicy="no-referrer"
                      @load=${this._onImageLoad}
                      @error=${this._onImageError}
                    />
                  </div>
                </div>
              `
            : ""}
          ${this._device ? this._renderIdentity(this._device) : nothing}
        </div>
      </hass-tabs-subpage>
    `;
  }

  private _renderIdentity(device: InsteonDevice): TemplateResult {
    const model = [device.description, device.model].filter(Boolean).join(" ");
    return html`
      <ha-card outlined .header=${this.insteon.localize("device.overview.caption")}>
        <div class="card-content">
          ${this._row("model", model)} ${this._row("address", device.address)}
          ${this._row("category", this._formatCategory(device))}
          ${this._row("engine_version", device.engine_version?.toUpperCase())}
          ${this._row("firmware", this._formatFirmware(device))}
          ${this._row(
            "aldb_status",
            html`<span class="chip ${this._aldbClass(device.aldb_status)}"
              >${device.aldb_status}</span
            >`,
          )}
          ${device.is_battery
            ? this._row("battery", this.insteon.localize("device.overview.battery_device"))
            : nothing}
          ${this._renderButtons(device)}
        </div>
      </ha-card>
    `;
  }

  private _row(
    key: string,
    value?: TemplateResult | string | null,
  ): TemplateResult | typeof nothing {
    if (value === undefined || value === null || value === "") {
      return nothing;
    }
    return html`
      <div class="row">
        <div class="label">${this.insteon.localize("device.overview.fields." + key)}</div>
        <div class="value">${value}</div>
      </div>
    `;
  }

  private _formatCategory(device: InsteonDevice): string | undefined {
    if (device.cat === undefined || device.cat === null) {
      return undefined;
    }
    const cat = "0x" + device.cat.toString(16).padStart(2, "0").toUpperCase();
    const subcat =
      device.subcat === undefined || device.subcat === null
        ? "?"
        : "0x" + device.subcat.toString(16).padStart(2, "0").toUpperCase();
    return `${cat} / ${subcat}`;
  }

  private _formatFirmware(device: InsteonDevice): string | undefined {
    if (device.firmware === undefined || device.firmware === null) {
      return undefined;
    }
    if (device.firmware === 0) {
      return this.insteon.localize("device.overview.not_identified");
    }
    return String(device.firmware);
  }

  private _aldbClass(status: string): string {
    if (status === "loaded") {
      return "ok";
    }
    if (status === "loading" || status === "partial") {
      return "warn";
    }
    return "bad";
  }

  private _renderButtons(device: InsteonDevice): TemplateResult | typeof nothing {
    const buttons = device.buttons || {};
    const groups = Object.keys(buttons);
    if (groups.length === 0) {
      return nothing;
    }
    return html`
      <div class="row">
        <div class="label">${this.insteon.localize("device.overview.fields.buttons")}</div>
        <div class="value">
          ${groups.map(
            (group) => html`<span class="chip button">${group}: ${buttons[group]}</span>`,
          )}
        </div>
      </div>
    `;
  }

  private _onImageLoad(ev) {
    ev.target.style.display = "inline-block";
  }

  private _onImageError(ev) {
    ev.target.style.display = "none";
  }

  private _handleBackTapped = async () => {
    navigate("/insteon/devices");
  };

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      css`
        :host {
          --app-header-background-color: var(--sidebar-background-color);
          --app-header-text-color: var(--sidebar-text-color);
          --app-header-border-bottom: 1px solid var(--divider-color);
        }

        .container {
          display: flex;
          flex-direction: column;
          margin: 0 32px;
        }

        :host([narrow]) .container {
          margin: 0 8px;
        }

        .page-header {
          padding: 8px;
          display: flex;
          justify-content: space-between;
        }

        .logo img {
          height: 30px;
        }

        .narrow-header {
          padding: 8px;
        }

        h1 {
          margin: 0;
          font-family: var(--paper-font-headline_-_font-family);
          -webkit-font-smoothing: var(--paper-font-headline_-_-webkit-font-smoothing);
          font-size: var(--paper-font-headline_-_font-size);
          font-weight: var(--paper-font-headline_-_font-weight);
          letter-spacing: var(--paper-font-headline_-_letter-spacing);
          line-height: var(--paper-font-headline_-_line-height);
          opacity: var(--dark-primary-opacity);
        }

        ha-card {
          max-width: 600px;
          margin-bottom: 24px;
        }

        .row {
          display: flex;
          padding: 6px 0;
          border-bottom: 1px solid var(--divider-color);
        }

        .row:last-child {
          border-bottom: none;
        }

        .label {
          width: 40%;
          color: var(--secondary-text-color);
        }

        .value {
          width: 60%;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .chip {
          border-radius: 10px;
          padding: 1px 10px;
          font-size: 13px;
          background-color: var(--secondary-background-color);
        }

        .chip.ok {
          background-color: var(--success-color, #0f9d58);
          color: var(--text-primary-color, #fff);
        }

        .chip.warn {
          background-color: var(--warning-color, #f4b400);
          color: var(--text-primary-color, #fff);
        }

        .chip.bad {
          background-color: var(--error-color, #db4437);
          color: var(--text-primary-color, #fff);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "insteon-device-overview-page": InsteonDeviceOverviewPage;
  }
}
