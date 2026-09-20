import { TranslocoModule } from '@jsverse/transloco';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-bottle-settings',
  standalone: true,
  imports: [TranslocoModule, CommonModule, FormsModule, MatSlideToggleModule, MatButtonModule],
  templateUrl: './bottle-settings.html',
  styleUrls: ['./bottle-settings.scss']
})
export class BottleSettingsComponent {
  settings = {
    enableBottleManagement: true,
    allowBottleReturns: true,
    allowBottleAdjustments: false,
    requireCustomerForDeposit: true,
    allowCashierRefunds: false
  };

  saveSettings() {
    alert('Settings saved successfully (API mocked)');
  }
}
