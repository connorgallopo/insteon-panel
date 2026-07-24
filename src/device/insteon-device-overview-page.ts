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
import "./insteon-device-plate";
import { plateLayout } from "./plate-layout";
import type { Insteon, InsteonDevice } from "../data/insteon";
import type { ALDBRecord } from "../data/device";
import { fetchInsteonDevice, fetchInsteonALDB } from "../data/device";

@customElement("insteon-device-overview-page")
class InsteonDeviceOverviewPage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public insteon!: Insteon;

  @property({ type: Boolean, reflect: true }) public narrow!: boolean;

  @property({ type: Boolean }) public isWide?: boolean;

  @property({ type: Object }) public route?: Route;

  @property() private deviceId?: string;

  @state() private _device?: InsteonDevice;

  @state() private _aldb?: ALDBRecord[];

  @state() private _selectedGroup?: number;

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    if (this.deviceId && this.hass) {
      fetchInsteonDevice(this.hass, this.deviceId).then(
        (device) => {
          this._device = device;
          const groups = Object.keys(device.buttons || {});
          if (groups.length > 0) {
            this._selectedGroup = Number(groups[0]);
            fetchInsteonALDB(this.hass, device.address).then(
              (records) => {
                this._aldb = records;
              },
              () => {
                this._aldb = [];
              },
            );
          }
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
          <div class="page-header">
            <div class="identity">
              <h1>${this._device?.name}</h1>
              ${this._device ? this._renderChips(this._device) : nothing}
            </div>
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
          ${this._device ? this._renderButtonsCard(this._device) : nothing}
        </div>
      </hass-tabs-subpage>
    `;
  }

  private _renderChips(device: InsteonDevice): TemplateResult {
    const model = [device.description, device.model].filter(Boolean).join(" ");
    return html`
      <div class="chips">
        ${model ? html`<span class="chip">${model}</span>` : nothing}
        <span class="chip mono">${device.address}</span>
        ${this._categoryChip(device)}
        ${device.engine_version
          ? html`<span class="chip">${device.engine_version.toUpperCase()}</span>`
          : nothing}
        ${this._firmwareChip(device)}
        <span class="chip ${this._aldbClass(device.aldb_status)}">
          ${this.insteon.localize("device.overview.fields.aldb_status")}: ${device.aldb_status}
        </span>
        ${device.is_battery
          ? html`<span class="chip">
              ${this.insteon.localize("device.overview.battery_device")}
            </span>`
          : nothing}
      </div>
    `;
  }

  private _categoryChip(device: InsteonDevice): TemplateResult | typeof nothing {
    if (device.cat === undefined || device.cat === null) {
      return nothing;
    }
    const cat = "0x" + device.cat.toString(16).padStart(2, "0").toUpperCase();
    const subcat =
      device.subcat === undefined || device.subcat === null
        ? "?"
        : "0x" + device.subcat.toString(16).padStart(2, "0").toUpperCase();
    return html`<span class="chip mono">${cat} / ${subcat}</span>`;
  }

  private _firmwareChip(device: InsteonDevice): TemplateResult | typeof nothing {
    if (device.firmware === undefined || device.firmware === null) {
      return nothing;
    }
    if (device.firmware === 0) {
      return html`<span class="chip warn">
        ${this.insteon.localize("device.overview.not_identified")}
      </span>`;
    }
    return html`<span class="chip">
      ${this.insteon.localize("device.overview.fields.firmware")} ${device.firmware}
    </span>`;
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

  private _renderButtonsCard(device: InsteonDevice): TemplateResult | typeof nothing {
    const buttons = device.buttons || {};
    const groups = Object.keys(buttons);
    if (groups.length === 0) {
      return nothing;
    }
    const layout = plateLayout(device.cat, device.subcat);
    if (layout === "none") {
      return html`
        <ha-card outlined .header=${this.insteon.localize("device.overview.fields.buttons")}>
          <div class="card-content">
            <div class="buttons">
              ${groups.map(
                (group) => html`
                  <div class="button-tile">
                    <span class="button-group">${group}</span>
                    <span class="button-name">${this._buttonLabel(buttons[group])}</span>
                  </div>
                `,
              )}
            </div>
          </div>
        </ha-card>
      `;
    }
    return html`
      <ha-card outlined .header=${this.insteon.localize("device.overview.fields.buttons")}>
        <div class="card-content">
          <div class="plate-and-pane">
            <insteon-device-plate
              .cat=${device.cat}
              .subcat=${device.subcat}
              .selected=${this._selectedGroup}
              @insteon-button-selected=${this._handleButtonSelected}
            ></insteon-device-plate>
            ${this._renderButtonPane(device)}
          </div>
        </div>
      </ha-card>
    `;
  }

  private _handleButtonSelected(ev: CustomEvent<{ group: number }>) {
    this._selectedGroup = ev.detail.group;
  }

  private _renderButtonPane(device: InsteonDevice): TemplateResult | typeof nothing {
    const group = this._selectedGroup;
    if (group === undefined) {
      return nothing;
    }
    const buttons = device.buttons || {};
    const singleButton = Object.keys(buttons).length === 1;
    const records = (this._aldb || []).filter((rec) => rec.in_use);
    const controls = records.filter((rec) => rec.is_controller && rec.group === group);
    const respondsTo = records.filter(
      (rec) =>
        !rec.is_controller &&
        (singleButton ||
          rec.data3 === group ||
          (group === 1 && (rec.data3 === 0 || rec.data3 === 1))),
    );
    const name = this._buttonLabel(buttons[group] || "");
    return html`
      <div class="pane">
        <div class="pane-title">${name}</div>
        <div class="pane-sub">${this.insteon.localize("device.overview.pane.group")} ${group}</div>
        <div class="pane-section">
          <div class="pane-label">${this.insteon.localize("device.overview.pane.controls")}</div>
          ${controls.length === 0
            ? html`<div class="pane-empty">
                ${this.insteon.localize("device.overview.pane.no_links")}
              </div>`
            : controls.map(
                (rec) => html`
                  <div class="link-row">
                    <span class="link-who">${rec.target_name || rec.target}</span>
                  </div>
                `,
              )}
        </div>
        <div class="pane-section">
          <div class="pane-label">${this.insteon.localize("device.overview.pane.responds_to")}</div>
          ${respondsTo.length === 0
            ? html`<div class="pane-empty">
                ${this.insteon.localize("device.overview.pane.no_links")}
              </div>`
            : respondsTo.map(
                (rec) => html`
                  <div class="link-row">
                    <span class="link-who">${rec.target_name || rec.target}</span>
                    <span class="link-how">
                      ${this.insteon.localize("device.overview.pane.group")} ${rec.group}
                    </span>
                  </div>
                `,
              )}
        </div>
      </div>
    `;
  }

  private _buttonLabel(name: string): string {
    return name.replace(/_/g, " ");
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
          margin: 8px 32px 0;
        }

        :host([narrow]) .container {
          margin: 8px 8px 0;
        }

        .page-header {
          padding: 8px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .identity {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 0;
        }

        h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 400;
          line-height: 1.2;
          color: var(--primary-text-color);
        }

        .logo img {
          height: 30px;
        }

        .narrow-header {
          padding: 8px;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .chip {
          border-radius: 999px;
          padding: 3px 12px;
          font-size: 13px;
          line-height: 1.4;
          background-color: var(--secondary-background-color);
          color: var(--secondary-text-color);
          border: 1px solid var(--divider-color);
          white-space: nowrap;
        }

        .chip.mono {
          font-family: var(--ha-font-family-code, monospace);
          font-size: 12.5px;
        }

        .chip.ok {
          background-color: rgba(var(--rgb-success-color, 15, 157, 88), 0.15);
          color: var(--success-color, #0f9d58);
          border-color: transparent;
        }

        .chip.warn {
          background-color: rgba(var(--rgb-warning-color, 244, 180, 0), 0.15);
          color: var(--warning-color, #b26a00);
          border-color: transparent;
        }

        .chip.bad {
          background-color: rgba(var(--rgb-error-color, 219, 68, 55), 0.15);
          color: var(--error-color, #db4437);
          border-color: transparent;
        }

        ha-card {
          max-width: 760px;
          margin: 8px;
        }

        .plate-and-pane {
          display: flex;
          gap: 28px;
          flex-wrap: wrap;
          align-items: flex-start;
        }

        .pane {
          flex: 1 1 260px;
          min-width: 240px;
        }

        .pane-title {
          font-size: 16px;
          font-weight: 500;
          color: var(--primary-text-color);
          text-transform: capitalize;
        }

        .pane-sub {
          font-size: 12.5px;
          color: var(--secondary-text-color);
          margin-bottom: 12px;
        }

        .pane-section {
          margin-bottom: 14px;
        }

        .pane-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--secondary-text-color);
          margin-bottom: 6px;
        }

        .pane-empty {
          font-size: 13px;
          color: var(--secondary-text-color);
        }

        .link-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 7px 10px;
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          margin-bottom: 6px;
          font-size: 13.5px;
        }

        .link-row .link-who {
          font-weight: 500;
          color: var(--primary-text-color);
        }

        .link-row .link-how {
          font-size: 12.5px;
          color: var(--secondary-text-color);
          white-space: nowrap;
        }

        .buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .button-tile {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border: 1px solid var(--divider-color);
          border-radius: 8px;
        }

        .button-group {
          font-family: var(--ha-font-family-code, monospace);
          font-size: 12px;
          color: var(--secondary-text-color);
        }

        .button-name {
          font-size: 14px;
          color: var(--primary-text-color);
          text-transform: capitalize;
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
