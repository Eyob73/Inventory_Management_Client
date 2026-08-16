import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RECENT_ACTIVITIES } from '../../dashboard-data';

@Component({
  selector: 'app-recent-activities',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './recent-activities.html',
  styleUrl: './recent-activities.scss',
})
export class RecentActivities {
  readonly activities = RECENT_ACTIVITIES;
}
