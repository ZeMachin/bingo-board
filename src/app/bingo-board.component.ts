import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BingoTileComponent } from './bingo-tile.component';
import tilesData from '../data/tiles.json';

interface Tile {
    id: number;
    image: string;
    alt: string;
    description: string;
}

@Component({
    selector: 'app-bingo-board',
    template: `
    <section class="board-container">
      <h2 class="visually-hidden">Bingo board</h2>
      <div class="board" role="grid" aria-label="7 by 7 bingo board">
        @for(row of tiles(); track row) {
          @for(tile of row; track tile.id) {
            <div class="board-cell" role="gridcell">
              <app-bingo-tile
                [image]="tile.image"
                [alt]="tile.alt"
                [description]="tile.description"
              ></app-bingo-tile>
            </div>
          }
        }
        </div>
    </section>
  `,
    styles: [`
    .board-container { padding: 1rem; }
    .visually-hidden { position:absolute !important; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden; }

    /* Grid */
    .board { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; max-width: 1000px; margin: 0 auto; }
    .board-cell { width: 100%; }

    // /* Add a subtle panel header look */
    // .board::before { content: ''; display:block; height: 8px; background: linear-gradient(90deg, rgba(212,175,55,1), rgba(255,220,120,0.8)); margin-bottom: 8px; border-radius: 3px; box-shadow: 0 2px 0 rgba(0,0,0,0.15) inset; }

    @media (max-width: 700px) { .board { grid-template-columns: repeat(4, 1fr); } }
  `],
    imports: [CommonModule, BingoTileComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BingoBoardComponent {
    private _tiles = signal<Tile[][]>(this.getTiles());
    readonly tiles = this._tiles;

    getTiles(): Tile[][] {
        return tilesData.tiles;    
    }
}
