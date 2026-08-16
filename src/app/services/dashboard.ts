import { Injectable, signal, computed, effect } from '@angular/core';
import { WidgetDefinition, UserWidgetConfig, DashboardWidget, WidgetSettings } from '../models/dashboard';
import { WIDGET_REGISTRY } from '../features/dashboard/widget-registry';

const STORAGE_KEY = 'dashboard_widget_config_v3';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  readonly availableDefinitions = WIDGET_REGISTRY;

  /** Raw widget user configurations signal */
  private readonly _userConfigs = signal<UserWidgetConfig[]>(this._loadConfig());

  /** Loading state map for widgets */
  private readonly _loadingMap = signal<Record<string, boolean>>({});

  /** Error state map for widgets */
  private readonly _errorMap = signal<Record<string, string | null>>({});

  constructor() {
    // Automatically synchronize signal state with localStorage via Angular effect()
    effect(() => {
      const configs = this._userConfigs();
      this._saveConfig(configs);
    });
  }

  /**
   * Computed list of all registered widgets merged with user configs (active & inactive).
   */
  readonly allWidgets = computed<DashboardWidget[]>(() => {
    const configs = this._userConfigs();
    const loading = this._loadingMap();
    const errors = this._errorMap();

    return this.availableDefinitions.map((def) => {
      const saved = configs.find((c) => c.id === def.id);
      const visible = saved ? saved.visible : def.defaultVisible;
      const columns = saved ? saved.columns : def.defaultColumns;
      const rows = saved ? saved.rows : def.defaultRows;
      const position = saved ? saved.position : 999;
      const settings = saved?.settings ?? { bgStyle: 'default' };

      return {
        id: def.id,
        label: def.label,
        icon: def.icon,
        description: def.description,
        category: def.category ?? 'charts',
        component: def.content,
        inputs: def.inputs,
        columns,
        rows,
        position,
        visible,
        minColumns: def.minColumns ?? 1,
        maxColumns: def.maxColumns ?? 4,
        minRows: def.minRows ?? 1,
        maxRows: def.maxRows ?? 4,
        settings,
        loading: loading[def.id] ?? false,
        error: errors[def.id] ?? null,
      };
    });
  });

  /**
   * Computed list of active (visible) widgets, sorted by position.
   */
  readonly activeWidgets = computed<DashboardWidget[]>(() => {
    return this.allWidgets()
      .filter((w) => w.visible)
      .sort((a, b) => a.position - b.position);
  });

  /** Add widget to active dashboard */
  addWidget(id: string): void {
    this._userConfigs.update((configs) => {
      const existingIndex = configs.findIndex((c) => c.id === id);
      const maxPos = configs.reduce((max, c) => Math.max(max, c.position), -1);

      if (existingIndex >= 0) {
        return configs.map((c) =>
          c.id === id ? { ...c, visible: true, position: maxPos + 1 } : c,
        );
      } else {
        const def = this.availableDefinitions.find((w) => w.id === id);
        if (!def) return configs;
        return [
          ...configs,
          {
            id: def.id,
            columns: def.defaultColumns,
            rows: def.defaultRows,
            position: maxPos + 1,
            visible: true,
          },
        ];
      }
    });
  }

  /** Remove widget from active dashboard */
  removeWidget(id: string): void {
    this._userConfigs.update((configs) =>
      configs.map((c) => (c.id === id ? { ...c, visible: false } : c)),
    );
  }

  /** Resize widget dimensions (columns and rows) */
  resizeWidget(id: string, columns: number, rows: number): void {
    const def = this.availableDefinitions.find((w) => w.id === id);
    if (!def) return;

    const clampedCols = Math.min(
      def.maxColumns ?? 4,
      Math.max(def.minColumns ?? 1, columns),
    );
    const clampedRows = Math.min(
      def.maxRows ?? 4,
      Math.max(def.minRows ?? 1, rows),
    );

    this._userConfigs.update((configs) =>
      configs.map((c) =>
        c.id === id ? { ...c, columns: clampedCols, rows: clampedRows } : c,
      ),
    );
  }

  /** Move widget to a new position index */
  moveWidget(id: string, newPosition: number): void {
    this._userConfigs.update((configs) => {
      const active = [...configs]
        .filter((c) => c.visible)
        .sort((a, b) => a.position - b.position);

      const oldIndex = active.findIndex((c) => c.id === id);
      if (oldIndex === -1) return configs;

      const item = active.splice(oldIndex, 1)[0];
      active.splice(newPosition, 0, item);

      // Re-assign positions sequentially
      const updatedActiveMap = new Map(
        active.map((item, idx) => [item.id, idx]),
      );

      return configs.map((c) => ({
        ...c,
        position: updatedActiveMap.has(c.id)
          ? updatedActiveMap.get(c.id)!
          : c.position,
      }));
    });
  }

  /** Reorder active widgets array from Drag & Drop */
  reorderWidgets(orderedIds: string[]): void {
    this._userConfigs.update((configs) => {
      const posMap = new Map(orderedIds.map((id, index) => [id, index]));
      return configs.map((c) => ({
        ...c,
        position: posMap.has(c.id) ? posMap.get(c.id)! : c.position,
      }));
    });
  }

  /** Update generic customization settings for a widget */
  updateWidgetSettings(id: string, newSettings: Partial<WidgetSettings>): void {
    this._userConfigs.update((configs) =>
      configs.map((c) =>
        c.id === id
          ? { ...c, settings: { ...(c.settings ?? {}), ...newSettings } }
          : c,
      ),
    );
  }

  /** Simulate reloading a widget (loading state UX) */
  reloadWidget(id: string): void {
    this._loadingMap.update((m) => ({ ...m, [id]: true }));
    this._errorMap.update((m) => ({ ...m, [id]: null }));

    setTimeout(() => {
      this._loadingMap.update((m) => ({ ...m, [id]: false }));
    }, 800);
  }

  /** Reset dashboard to default widget configuration */
  resetDashboard(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    this._userConfigs.set(this._defaultConfig());
  }

  // ──────────────────────────────────────────────────────────────
  // Private Helpers
  // ──────────────────────────────────────────────────────────────

  private _loadConfig(): UserWidgetConfig[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: UserWidgetConfig[] = JSON.parse(raw);
        // Merge saved configs with WIDGET_REGISTRY definitions
        const merged: UserWidgetConfig[] = [];
        this.availableDefinitions.forEach((def, index) => {
          const saved = parsed.find((c) => c.id === def.id);
          if (saved) {
            merged.push({
              id: def.id,
              columns: saved.columns ?? def.defaultColumns,
              rows: saved.rows ?? def.defaultRows,
              position: saved.position ?? index,
              visible: saved.visible ?? def.defaultVisible,
              settings: saved.settings ?? { bgStyle: 'default' },
            });
          } else {
            merged.push({
              id: def.id,
              columns: def.defaultColumns,
              rows: def.defaultRows,
              position: index,
              visible: def.defaultVisible,
              settings: { bgStyle: 'default' },
            });
          }
        });
        return merged;
      }
    } catch {
      // Corrupted storage fallback
    }
    return this._defaultConfig();
  }

  private _defaultConfig(): UserWidgetConfig[] {
    return this.availableDefinitions.map((def, index) => ({
      id: def.id,
      columns: def.defaultColumns,
      rows: def.defaultRows,
      position: index,
      visible: def.defaultVisible,
      settings: { bgStyle: 'default' },
    }));
  }

  private _saveConfig(configs: UserWidgetConfig[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    } catch {
      // Quota exceeded ignore
    }
  }
}
