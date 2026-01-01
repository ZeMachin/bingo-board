import { Component, signal } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
import { BingoBoardComponent } from './bingo-board.component';

@Component({
  selector: 'app-root',
  imports: [BingoBoardComponent],
  templateUrl: './app.html',
  styleUrl: './app.less'
})
export class App {
  protected readonly title = signal('bingo-board');
}
