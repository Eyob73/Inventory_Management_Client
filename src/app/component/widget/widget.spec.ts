import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

import { Widget } from './widget';

@Component({
  selector: 'app-widget-stub',
  template: '<p>stub</p>',
})
class StubContent {}

describe('Widget', () => {
  let component: Widget;
  let fixture: ComponentFixture<Widget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Widget],
    }).compileComponents();

    fixture = TestBed.createComponent(Widget);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', {
      id: 1,
      label: 'Test',
      content: StubContent,
    });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
