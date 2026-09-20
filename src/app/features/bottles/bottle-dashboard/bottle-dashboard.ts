import { TranslocoModule } from '@jsverse/transloco';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BottleDashboardStore } from '../../../store/bottle-dashboard.store';
import { CardSkeleton } from '../../../ui/card-skeleton/card-skeleton';

@Component({
  selector: 'app-bottle-dashboard',
  standalone: true,
  imports: [TranslocoModule, CommonModule, MatCardModule, MatIconModule, CardSkeleton],
  templateUrl: './bottle-dashboard.html',
  styleUrls: ['./bottle-dashboard.scss']
})
export class BottleDashboardComponent implements OnInit {
  store = inject(BottleDashboardStore);

  ngOnInit(): void {
    this.store.loadDashboardStats();
  }
}
