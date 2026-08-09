import { Component, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  isScrolled = signal(false);
  pageTitle = signal('Dashboard');

  private readonly routeTitleMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/products': 'Products',
    '/categories': 'Categories',
    '/inventory': 'Inventory',
    '/sales': 'Sales',
    '/purchases': 'Purchases',
    '/customers': 'Customers',
    '/suppliers': 'Suppliers',
    '/reports': 'Reports',
    '/settings': 'Settings',
  };

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        const url = (e as NavigationEnd).urlAfterRedirects || (e as NavigationEnd).url;
        const title = this.routeTitleMap[url] || this.formatTitle(url);
        this.pageTitle.set(title);
      });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 8);
  }

  private formatTitle(url: string): string {
    const segment = url.split('/').filter(Boolean).pop() || 'Dashboard';
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  }
}