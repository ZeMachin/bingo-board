import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BingoTileComponent } from './bingo-tile.component';
import { tilesData } from '../data/tiles';
import { Tile } from '../model/tile';

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
                [tooltip]="tile.tooltip"
                [title]="tile.alt"
                [locked]="tile.locked ?? false"
                [checked]="tile.checked ?? false"
                (checkedChange)="onTileChecked(tile, $event)"
                (info)="openModal(tile)"
              ></app-bingo-tile>
            </div>
          }
        }
      </div>

      @if(modalTile()) {
        <div id="tile-modal" class="modal-overlay" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="tile-modal-title" (click)="closeModal()" (keydown.escape)="closeModal()">
          <div class="modal-content" role="document" (click)="$event.stopPropagation()">
            <h3 id="tile-modal-title">{{ modalTile()!.alt }}</h3>
            <div class="modal-body" [innerHTML]="modalTile()!.tooltip ? modalTile()!.tooltip : modalTile()!.description"></div>
            <button type="button" class="modal-close" id="modal-close" (click)="closeModal()">Close</button>
          </div>
        </div>
      }

    </section>
  `,
  styles: [`
    .board-container { padding: 1rem; }
    .visually-hidden { position:absolute !important; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden; }

    /* Grid */
    .board { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; max-width: 1000px; margin: 0 auto; }
    .board-cell { width: 100%; }

    /* Modal styles */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index: 1100; }
    .modal-content { background: linear-gradient(180deg, rgba(255,250,240,0.98), rgba(245,235,215,0.95)); border: 3px solid var(--osrs-border); padding: 1rem; max-width: 640px; width: calc(100% - 2rem); border-radius: 6px; box-shadow: 6px 6px 0 var(--osrs-shadow); color: var(--osrs-text); }
    .modal-content h3 { margin: 0 0 0.5rem 0; color: var(--osrs-accent); }
    .modal-body { font-size: 0.95rem; line-height: 1.35; }
    .modal-close { background: var(--osrs-accent); border: none; padding: 0.4rem 0.8rem; border-radius: 4px; margin-top: 0.75rem; cursor: pointer; }
    .modal-close:focus { outline: none; box-shadow: 0 0 0 3px rgba(212,175,55,0.25); }

    @media (max-width: 700px) { .board { grid-template-columns: repeat(4, 1fr); } }
  `],
  imports: [CommonModule, BingoTileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BingoBoardComponent {
  private _tiles = signal<Tile[][]>(this.getTiles());
  readonly tiles = this._tiles;

  // modal state
  private _modal = signal<Tile | null>(null);
  readonly modalTile = this._modal;

  getTiles(): Tile[][] {
    return tilesData;
  }

  onTileChecked(tile: Tile, checked: boolean) {
    // update the board state so checked status persists
    this._tiles.update(rows => rows.map(row => row.map(t => t.id === tile.id ? { ...t, checked } : t)));
  }

  openModal(tile: Tile) {
    this._modal.set(tile);
    // focus the modal close button after it is rendered (fallback to overlay)
    setTimeout(() => {
      const closeBtn = document.getElementById('modal-close');
      if (closeBtn) (closeBtn as HTMLElement).focus();
      else { const el = document.getElementById('tile-modal'); if (el) (el as HTMLElement).focus(); }
    });
  }

  closeModal() {
    this._modal.set(null);
  }
}
