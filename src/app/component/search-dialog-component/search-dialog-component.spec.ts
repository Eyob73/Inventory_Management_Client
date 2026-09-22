import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchDialogComponent } from './search-dialog-component';

describe('SearchDialogComponent', () => {
  let component: SearchDialogComponent;
  let fixture: ComponentFixture<SearchDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
