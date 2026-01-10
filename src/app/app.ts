import { Component, signal, ViewChild } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
import { BingoBoardComponent } from './bingo-board/bingo-board.component';
import { version } from '../../package.json';
import { TeamSelection } from "./team-selection/team-selection";
import { Team } from '../models/team';

@Component({
  selector: 'app-root',
  imports: [BingoBoardComponent, TeamSelection],
  templateUrl: './app.html',
  styleUrl: './app.less'
})
export class App {
  protected readonly title = signal('bingo-board');
  protected readonly version = version;
  selectedTeam?: Team;
  @ViewChild(BingoBoardComponent) board: BingoBoardComponent | undefined;

  onSelectTeam(team: Team) {
    this.selectedTeam = team;
    this.board?.selectTeam(team);
  }
}
