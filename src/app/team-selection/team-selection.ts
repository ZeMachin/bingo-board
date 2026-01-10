import { Component, computed, EventEmitter, Output, signal } from '@angular/core';
import { teams as teamsData } from '../../data/teams';
import { Team } from '../../models/team';
import { Tile } from '../../models/tile';
import { tilesData } from '../../data/tiles';

@Component({
  selector: 'app-team-selection',
  imports: [],
  templateUrl: './team-selection.html',
  styleUrl: './team-selection.less',
})
export class TeamSelection {
  @Output() selectTeam: EventEmitter<Team> = new EventEmitter();
  private _teams = signal<Team[]>(teamsData);
  readonly teams = this._teams;
  private selectedTeam?: Team;
  private _tiles = signal<Tile[][]>(this.getTiles());
  // teams & per-team persistence
  private readonly storageKeyPrefix = 'bingo:checked-tiles:';

  teamSelection(team: Team) {
    this.selectedTeam = team;
    this.selectTeam.emit(this.selectedTeam);
  }

  isSelected(team: Team): boolean {
    return this.selectedTeam == team;
  }

  readonly totalCount = computed(() => {
    return this._tiles().map((tiles) => this.sumWeight(tiles)).reduce((a, b) => a + b, 0);
  });

  sumWeight = (tiles: Tile[]) => tiles.filter((tile) => !tile.fun).map((tile) => tile.weight).reduce((a, b) => a + b, 0);

  teamCheckedCount(team: Team) {
    const saved = this.loadSavedCheckedForTeam(team);
    let c = 0;
    for (const row of this.getTiles()) {
      for (const t of row) {
        if (!t.fun && (saved[t.id] ?? false)) c += t.weight;
      }
    }
    return c;
  }

  getTiles(): Tile[][] {
    // Lock all challenge tiles on load
    return tilesData.map(row =>
      row.map(tile => tile.challenge ? { ...tile, locked: true } : { ...tile })
    );
  }

  private loadSavedCheckedForTeam(team: Team): Record<number, boolean> {
    try {
      if (typeof localStorage === 'undefined') return {};
      const raw = localStorage.getItem(this.storageKeyForTeam(team));
      if (!raw) return {};
      const parsed = JSON.parse(raw) as number[] | Record<string, boolean>;
      const map: Record<number, boolean> = {};
      if (Array.isArray(parsed)) {
        parsed.forEach((id: number) => { map[Number(id)] = true; });
      } else {
        for (const k of Object.keys(parsed)) { map[Number(k)] = !!(parsed as Record<string, boolean>)[k]; }
      }
      return map;
    } catch (err) {
      return {};
    }
  }

  private storageKeyForTeam(team: Team) {
    return this.storageKeyPrefix + encodeURIComponent(team.name);
  }
}
