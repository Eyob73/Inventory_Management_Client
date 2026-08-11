import { Component } from '@angular/core';

@Component({
  selector: 'app-widget',
  imports: [],
  templateUrl: './widget.html',
  styleUrl: './widget.scss',
})
export class Widget {
  data = input.required<Widget>();
}
