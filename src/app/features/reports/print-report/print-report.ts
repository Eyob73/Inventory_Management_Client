import { Component, OnInit, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ReportsService } from '../../../services/reports.service';
import { AuthStore } from '../../../store/auth.store';
import {
  DashboardReport,
  SalesReport,
  PurchasesReport,
  InventoryReport,
} from '../../../models/reports.model';

@Component({
  selector: 'app-print-report',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './print-report.html',
  styleUrl: './print-report.scss',
})
export class PrintReportComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private reportsService = inject(ReportsService);
  private authStore = inject(AuthStore);

  readonly tenantName = computed(() => this.authStore.user()?.tenantName || 'Inventory Management System');
  readonly userFullName = computed(() => {
    const u = this.authStore.user();
    if (u?.firstName || u?.lastName) return `${u.firstName || ''} ${u.lastName || ''}`.trim();
    return u?.userName || u?.email || 'System User';
  });

  readonly currentDate = new Date();
  
  startDate = signal<string>('');
  endDate = signal<string>('');
  tab = signal<string>('');

  loading = signal<boolean>(true);
  error = signal<boolean>(false);

  dashboardData = signal<DashboardReport | null>(null);
  salesData = signal<SalesReport | null>(null);
  purchasesData = signal<PurchasesReport | null>(null);
  inventoryData = signal<InventoryReport | null>(null);

  autoPdf = signal<boolean>(false);

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParams;
    if (queryParams['start']) this.startDate.set(queryParams['start']);
    if (queryParams['end']) this.endDate.set(queryParams['end']);
    if (queryParams['tab']) this.tab.set(queryParams['tab']);
    if (queryParams['autoPdf']) this.autoPdf.set(true);

    // Default to last 30 days if no date
    if (!this.startDate() || !this.endDate()) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      this.startDate.set(thirtyDaysAgo.toISOString());
      this.endDate.set(now.toISOString());
    }

    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    const filter = {
      startDate: this.startDate(),
      endDate: this.endDate(),
      pageSize: 100
    };

    forkJoin({
      dash: this.reportsService.getDashboard(filter),
      sales: this.reportsService.getSales(filter),
      purchases: this.reportsService.getPurchases(filter),
      inv: this.reportsService.getInventory(filter)
    }).subscribe({
      next: (res) => {
        this.dashboardData.set(res.dash);
        this.salesData.set(res.sales);
        this.purchasesData.set(res.purchases);
        this.inventoryData.set(res.inv);
        this.loading.set(false);
        
        if (this.autoPdf()) {
          this.generatePdfDownload();
        } else {
          setTimeout(() => window.print(), 500); // Auto trigger print
        }
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  async generatePdfDownload(): Promise<void> {
    try {
      // Dynamic imports to avoid build errors if not installed yet
      // @ts-ignore
      const { jsPDF } = await import('jspdf');
      // @ts-ignore
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      
      setTimeout(async () => {
        const element = document.querySelector('.report-document') as HTMLElement;
        if (!element) return;
        
        // Hide controls during capture
        const controls = document.querySelector('.print-controls') as HTMLElement;
        if (controls) controls.style.display = 'none';

        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // Handle multipage if content is taller than A4 page height
        const pageHeight = pdf.internal.pageSize.getHeight();
        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }
        
        pdf.save(`Inventory-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
        
        if (window.parent && window.parent !== window) {
          window.parent.postMessage('pdf-done', '*');
        } else {
          window.close();
        }
      }, 500);
    } catch (e) {
      console.error('PDF generation failed', e);
      this.error.set(true);
      if (window.parent && window.parent !== window) {
        window.parent.postMessage('pdf-error', '*');
      }
    }
  }

  printDocument(): void {
    window.print();
  }

  goBack(): void {
    this.router.navigate(['/reports']);
  }
}
