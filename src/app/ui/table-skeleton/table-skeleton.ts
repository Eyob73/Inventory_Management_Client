import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export interface TableSkeletonColumn {
  /** CSS width, e.g. '40%', '120px' */
  width?: string;
  /** Show a secondary bone under the primary (e.g. name + description) */
  dual?: boolean;
  /** Align cell content */
  align?: 'left' | 'right' | 'center';
}

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  templateUrl: './table-skeleton.html',
  styleUrl: './table-skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSkeleton {
  /** Number of placeholder rows */
  rows = input(6);

  /**
   * Column count, or an array of column configs for custom widths.
   * Defaults to 6 equal columns.
   */
  columns = input<number | TableSkeletonColumn[]>(6);

  /** Show a header row of bones */
  showHeader = input(true);

  /** Show a footer / pagination bone */
  showFooter = input(true);

  readonly columnDefs = computed<TableSkeletonColumn[]>(() => {
    const cols = this.columns();
    if (typeof cols === 'number') {
      return Array.from({ length: Math.max(1, cols) }, () => ({}));
    }
    return cols.length ? cols : [{}];
  });

  readonly rowIndexes = computed(() =>
    Array.from({ length: Math.max(1, this.rows()) }, (_, i) => i)
  );

  /** Varied widths so rows don’t look identical */
  boneWidth(seed: number, compact = false): string {
    const widths = compact
      ? ['48%', '56%', '40%', '62%', '44%', '52%']
      : ['78%', '64%', '88%', '55%', '72%', '60%', '82%', '48%'];
    return widths[Math.abs(seed) % widths.length];
  }
}
