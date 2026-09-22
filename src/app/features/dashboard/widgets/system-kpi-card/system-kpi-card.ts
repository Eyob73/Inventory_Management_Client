import { Component, input, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SystemDashboardStore } from '../../../../store/system-dashboard.store';

@Component({
  selector: 'app-system-kpi-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './system-kpi-card.html',
  styleUrl: './system-kpi-card.scss',
})
export class SystemKpiCard {
  private readonly store = inject(SystemDashboardStore);

  kpiType = input.required<'totalCompanies' | 'activeCompanies' | 'inactiveCompanies' | 'totalUsers'>();

  readonly kpi = computed(() => {
    const data = this.store.data();
    if (!data) return { label: 'Loading...', value: '-', sub: '', icon: 'sync', color: 'teal' };

    switch (this.kpiType()) {
      case 'totalCompanies':
        return {
          label: 'Total Companies',
          value: data.totalCompanies.toString(),
          sub: 'Registered tenants',
          icon: 'business',
          color: 'teal'
        };
      case 'activeCompanies':
        return {
          label: 'Active Companies',
          value: data.activeCompanies.toString(),
          sub: 'Currently active',
          icon: 'check_circle',
          color: 'green'
        };
      case 'inactiveCompanies':
        const inactive = data.totalCompanies - data.activeCompanies;
        return {
          label: 'Inactive Companies',
          value: inactive.toString(),
          sub: 'Suspended or Deactivated',
          icon: 'warning',
          color: 'amber'
        };
      case 'totalUsers':
        return {
          label: 'Total Users',
          value: data.totalUsers.toString(),
          sub: 'Across all companies',
          icon: 'people',
          color: 'blue'
        };
    }
  });
}

