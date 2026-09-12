import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SystemService, SystemDashboardDto } from '../../../../services/system';

@Component({
  selector: 'app-system-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule],
  templateUrl: './system-dashboard.html',
  styleUrl: './system-dashboard.scss',
})
export class SystemDashboard implements OnInit {
  private systemService = inject(SystemService);
  
  data = signal<SystemDashboardDto | null>(null);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.systemService.getDashboard().subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
