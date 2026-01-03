import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BingoTileComponent } from './bingo-tile.component';
import { tilesData } from '../data/tiles';
import { Tile } from '../model/tile';

@Component({
  selector: 'app-bingo-board',
  template: `
    <section class="board-container">
      <h2 class="visually-hidden">Bingo board</h2>

      <div class="board-wrapper">
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

        <aside class="side-panel" aria-label="Checked tiles summary">
          <div class="counter" aria-live="polite" aria-atomic="true">
            <div class="counter-label">Total</div>
            <div class="counter-value" [class.pulse]="counterPulse()">{{ checkedCount() }} / {{ totalCount() }}</div>
          </div>
        </aside>
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

    /* Board layout with side panel */
    .board-wrapper { display: flex; align-items: flex-start; gap: 1rem; max-width: 1100px; margin: 0 auto; }
    .board { flex: 1; display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; }
    .board-cell { width: 100%; }

    .side-panel { width: 140px; display:flex; align-items:center; justify-content:center; padding: 0.5rem; }
    .counter { background: linear-gradient(180deg, #fff, #f6f6f6); border: 2px solid rgba(0,0,0,0.06); border-radius: 8px; padding: 0.6rem 0.8rem; text-align:center; box-shadow: 3px 3px 0 rgba(0,0,0,0.06); }
    .counter-label { font-size: 0.75rem; color: #666; }
    .counter-value { font-size: 1.4rem; font-weight: 700; color: #2ecc71; margin-top:0.25rem; }

    /* Pulse animation when count changes */
    .counter-value.pulse { animation: bump 260ms cubic-bezier(.2,.9,.3,1); }
    @keyframes bump {
      0% { transform: scale(1); }
      40% { transform: scale(1.14); }
      100% { transform: scale(1); }
    }

    @media (max-width: 700px) { .board-wrapper { flex-direction: column; } .side-panel { width: 100%; } }

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

  readonly checkedCount = computed(() => {
    const rows = this._tiles();
    let c = 0;
    for (const row of rows) {
      for (const t of row) {
        if (t.checked) c++;
      }
    }
    return c;
  });

  readonly totalCount = computed(() => {
    const rows = this._tiles();
    let total = 0;
    for (const row of rows) total += row.length;
    return total;
  });

  // modal state
  private _modal = signal<Tile | null>(null);
  readonly modalTile = this._modal;

  // persistence key
  private readonly storageKey = 'bingo:checked-tiles';

  // counter pulse animation signal (exposed to template)
  readonly counterPulse = signal(false);

  constructor() {
    // load saved checked state and merge into tiles on startup
    const saved = this.loadSavedChecked();
    if (Object.keys(saved).length) {
      const merged = this.getTiles().map(row => row.map(t => ({ ...t, checked: saved[t.id] ?? t.checked ?? false })));
      this._tiles.set(merged);
    }

    // pulse the counter when checkedCount changes
    effect(() => {
      // read the value so effect re-runs on changes
      const _ = this.checkedCount();
      this.counterPulse.set(true);
      // short timeout to remove pulse
      setTimeout(() => this.counterPulse.set(false), 300);
    });

    // sync across windows/tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        try {
          if (e.key === this.storageKey) {
            const saved2 = this.loadSavedChecked();
            this._tiles.update(rows => rows.map(row => row.map(t => ({ ...t, checked: saved2[t.id] ?? t.checked ?? false }))));
          }
        } catch (err) { /* ignore */ }
      });
    }
  }

  getTiles(): Tile[][] {
    return tilesData;
  }

  onTileChecked(tile: Tile, checked: boolean) {
    // update the board state so checked status persists
    this._tiles.update(rows => rows.map(row => row.map(t => t.id === tile.id ? { ...t, checked } : t)));
    // persist the checked ids immediately
    this.saveCheckedToStorage();
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

  private loadSavedChecked(): Record<number, boolean> {
    try {
      if (typeof localStorage === 'undefined') return {};
      const raw = localStorage.getItem(this.storageKey);
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

  private saveCheckedToStorage() {
    try {
      if (typeof localStorage === 'undefined') return;
      const rows = this._tiles();
      const checkedIds: number[] = [];
      for (const row of rows) for (const t of row) if (t.checked) checkedIds.push(t.id);
      localStorage.setItem(this.storageKey, JSON.stringify(checkedIds));
    } catch (err) { /* ignore */ }
  }
}
