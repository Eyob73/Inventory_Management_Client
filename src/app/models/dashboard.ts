import { Type } from '@angular/core';

export interface WidgetSettings {
  bgStyle?: 'default' | 'surface' | 'glass' | 'accent';
  showIcon?: boolean;
  customTitle?: string;
  refreshInterval?: number;
  [key: string]: unknown;
}

/** Static definition registered in WIDGET_REGISTRY */
export interface WidgetDefinition {
  id: string;
  label: string;
  icon: string;
  description: string;
  category?: 'kpi' | 'charts' | 'tables' | 'lists';
  content: Type<unknown>;
  inputs?: Record<string, unknown>;
  defaultColumns: number;
  defaultRows: number;
  minColumns?: number;
  maxColumns?: number;
  minRows?: number;
  maxRows?: number;
  defaultVisible: boolean;
}

/** Saved serializable configuration stored in localStorage */
export interface UserWidgetConfig {
  id: string;
  columns: number;
  rows: number;
  position: number;
  visible: boolean;
  settings?: WidgetSettings;
}

/** Full active widget object composed for rendering in the dashboard wrapper */
export interface DashboardWidget {
  id: string;
  label: string;
  icon: string;
  description: string;
  category: 'kpi' | 'charts' | 'tables' | 'lists';
  component: Type<unknown>;
  inputs?: Record<string, unknown>;
  columns: number;
  rows: number;
  position: number;
  visible: boolean;
  minColumns: number;
  maxColumns: number;
  minRows: number;
  maxRows: number;
  settings: WidgetSettings;
  loading?: boolean;
  error?: string | null;
}
