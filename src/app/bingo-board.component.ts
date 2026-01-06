import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BingoTileComponent } from './bingo-tile.component';
import { tilesData } from '../data/tiles';
import { Tile } from '../models/tile';

@Component({
  selector: 'app-bingo-board',
  template: `
    <section class="board-container">
      <h2 class="visually-hidden">Bingo board</h2>

      <div class="board-wrapper">
          <div class="board" role="grid" aria-label="{{tiles().length}} by {{tiles()[0]?.length}} bingo board">
            @for(row of tiles(); let rowIndex = $index; track row) {
              <div class="row-label">Row {{ rowIndex + 1 }}</div>
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
                    [fun]="tile.fun ?? false"
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

      @if(confettiActive()) {
        <canvas id="confetti-canvas" class="confetti-canvas" tabindex="-1" aria-hidden="true"></canvas>
      }
      @if(celebrationShown() || confettiActive()) {
        <div id="celebration-message" class="celebration-message" [class.closing]="celebrationExiting()" role="status" aria-live="assertive" tabindex="-1">
          🎉 <strong>Congratulations!</strong><br/>You completed the board!
        </div>
        <div class="visually-hidden" role="status" aria-live="polite">Bingo! All tiles checked. Congratulations!</div>
      }

    </section>"
  `,
  styles: [`
    .board-container { padding: 1rem; }
    .visually-hidden { position:absolute !important; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden; }

    /* Board layout with side panel */
    .board-wrapper { display: flex; align-items: flex-start; gap: 1rem; max-width: 1100px; margin: 0 auto; padding: 0 0.5rem; }
    .board-with-row-labels { display: flex; gap: 0.5rem; flex: 1; }
    .row-labels { display: none; flex-direction: column; gap: 0.5rem; }
    .row-label { display: none; padding: 0.25rem 0; text-align: center; font-size: 0.75rem; font-weight: 600; color: #666; min-width: 3rem; }
    .board { flex: 1; display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.5rem; align-items: stretch; }
    .board-cell { width: 100%; aspect-ratio: 1 / 1; min-width: 64px; }

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

    @media (max-width: 1000px) {
      .board-wrapper { flex-direction: column; }
      .side-panel { width: 100%; }
      .board-with-row-labels { flex-direction: column; gap: 1rem; }
      .row-labels { display: flex; }
      .row-label { display: flex; align-items: center; justify-content: center; padding: 0.5rem 0; background: linear-gradient(135deg, rgba(46, 204, 113, 0.08), rgba(46, 204, 113, 0.04)); border-left: 3px solid #2ecc71; border-radius: 0 4px 4px 0; font-weight: 700; color: #27ae60; font-size: 0.8rem; min-height: 72px; min-width: 4rem; }
      .board { grid-template-columns: 1fr; gap: 0.6rem; width: 100%; }
    }

    @media (max-width: 420px) {
      .board { grid-template-columns: 1fr; gap: 0.5rem; }
      .counter-value { font-size: 1.1rem; }
      .row-label { font-size: 0.75rem; min-width: 3.5rem; }
    }

    /* Modal styles */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index: 1100; }
    .modal-content { background: linear-gradient(180deg, rgba(255,250,240,0.98), rgba(245,235,215,0.95)); border: 3px solid var(--osrs-border); padding: 1rem; max-width: 640px; width: calc(100% - 2rem); border-radius: 6px; box-shadow: 6px 6px 0 var(--osrs-shadow); color: var(--osrs-text); }
    .modal-content h3 { margin: 0 0 0.5rem 0; color: var(--osrs-accent); }
    .modal-body { font-size: 0.95rem; line-height: 1.35; }
    .modal-close { background: var(--osrs-accent); border: none; padding: 0.4rem 0.8rem; border-radius: 4px; margin-top: 0.75rem; cursor: pointer; }
    .modal-close:focus { outline: none; box-shadow: 0 0 0 3px rgba(212,175,55,0.25); }

    /* Confetti canvas overlay */
    .confetti-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 1200; width: 100%; height: 100%; mix-blend-mode: normal; }

    .celebration-message {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.98);
      z-index: 1300;
      background: rgba(255,255,255,0.92);
      padding: 0.8rem 1.2rem;
      border-radius: 12px;
      font-size: clamp(1.25rem, 3.6vw, 2.6rem);
      color: #073B4C;
      font-weight: 800;
      text-align: center;
      box-shadow: 0 12px 40px rgba(7,59,76,0.25);
      border: 2px solid rgba(7,59,76,0.06);
      line-height: 1;
      user-select: none;
      animation: celebration-pop 650ms cubic-bezier(.2,.9,.3,1) forwards;
    }
    .celebration-message.closing {
      /* run a concise hide animation when the message is being dismissed */
      animation: celebration-hide 420ms cubic-bezier(.4,0,.2,1) forwards;
    }
    @keyframes celebration-pop {
      0% { transform: translate(-50%, -50%) scale(0.7); opacity: 0; }
      60% { transform: translate(-50%, -50%) scale(1.08); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    @keyframes celebration-hide {
      0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(0.7); opacity: 0; }
    }
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
        if (t.checked) c += t.weight;
      }
    }
    return c;
  });

  readonly totalCount = computed(() => {
    return this._tiles().map((tiles) => this.sumWeight(tiles)).reduce((a, b) => a + b, 0);
  });

  sumWeight = (tiles: Tile[]) => tiles.filter((tile) => !tile.fun).map((tile) => tile.weight).reduce((a, b) => a + b, 0);

  // modal state
  private _modal = signal<Tile | null>(null);
  readonly modalTile = this._modal;

  // persistence key
  private readonly storageKey = 'bingo:checked-tiles';

  // counter pulse animation signal (exposed to template)
  readonly counterPulse = signal(false);

  // confetti state (shown when all non-fun tiles are checked)
  private _confettiActive = signal(false);
  readonly confettiActive = this._confettiActive;

  // celebration message visibility & exit animation state
  private _celebrationShown = signal(false);
  readonly celebrationShown = this._celebrationShown;
  private _celebrationExiting = signal(false);
  readonly celebrationExiting = this._celebrationExiting;
  private celebrationHideTimer = 0;

  // internals for canvas animation
  private confettiRaf = 0;
  private confettiBurstInterval = 0;
  private confettiParticles: Array<{ x: number; y: number; vx: number; vy: number; size: number; color: string; rot: number; vr: number; shape?: string; opacity?: number }> = [];

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

    // trigger confetti when all non-fun tiles are checked
    effect(() => {
      this.checkConfettiTrigger();
    });

    // update challenge tile locks
    this.updateChallengeLocks();
  }

  private checkConfettiTrigger() {
    if (this.isBoardCompleted()) this.triggerConfetti();
  }

  private isBoardCompleted = () => this.checkedCount() === this.totalCount() && this.totalCount() > 0;

  private triggerConfetti() {
    if (typeof window === 'undefined') return; // no-op during SSR
    if (this._confettiActive()) return; // already running

    // ensure the celebration message is visible and cancel any pending hide
    if (this.celebrationHideTimer) { clearTimeout(this.celebrationHideTimer); this.celebrationHideTimer = 0; }
    this._celebrationExiting.set(false);
    this._celebrationShown.set(true);

    this.confettiCycle();
  }

  private confettiCycle() {
    const CONFETTI_CYCLE_LENGTH = 2500;
    // ensure canvas is in DOM then initialize
    if (!this._confettiActive()) this.initConfetti(CONFETTI_CYCLE_LENGTH);
    this._confettiActive.set(true);
    // auto-stop after a short duration (give a bit more time for bursts and message)
    setTimeout(() => this.stopConfetti(), CONFETTI_CYCLE_LENGTH);
  }

  private initConfetti(cycleLength: number) {
    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPR = window.devicePixelRatio || 1;
    canvas.width = Math.max(window.innerWidth, 300) * DPR;
    canvas.height = Math.max(window.innerHeight, 200) * DPR;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const colors = ['#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#073B4C', '#9B5DE5', '#F9C74F'];
    const baseCount = 220;
    this.confettiParticles = [];

    const addParticle = (spawnX?: number, spawnY?: number) => {
      const x = typeof spawnX === 'number' ? spawnX : Math.random() * window.innerWidth;
      const y = typeof spawnY === 'number' ? spawnY : Math.random() * -window.innerHeight * 0.4;
      const size = Math.random() * 14 + 6;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shapeRoll = Math.random();
      const shape = shapeRoll < 0.6 ? 'rect' : shapeRoll < 0.85 ? 'circle' : 'triangle';
      this.confettiParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * (6 + Math.random() * 6),
        vy: Math.random() * 6 + 2 - Math.random() * 2,
        size,
        color,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.8,
        shape,
        opacity: 0.9 + Math.random() * 0.1,
      } as any);
    };

    for (let i = 0; i < baseCount; i++) addParticle();

    const MID_CENTER_BURST_INTERVALS = 200;

    const centerBurstConfettis = () => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      for (let i = 0; i < 36; i++) addParticle(cx + (Math.random() - 0.5) * 240, cy + (Math.random() - 0.5) * 120);
    }

    // periodic center bursts while active
    for (let i = 0; i < cycleLength - (MID_CENTER_BURST_INTERVALS * 5); i += MID_CENTER_BURST_INTERVALS)
      setTimeout(() => centerBurstConfettis(), i);

    // periodic center bursts while active
    // this.confettiBurstInterval = window.setInterval(() => {
    //   centerBurstConfettis();
    // }, MID_CENTER_BURST_INTERVALS) as unknown as number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of this.confettiParticles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx += Math.sin((p.y + p.x) * 0.01) * 0.02;
        p.vy += 0.12; // gravity
        p.rot += p.vr;

        ctx.save();
        ctx.globalAlpha = p.opacity ?? 1;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }
        ctx.restore();
      }

      // age & fade particles
      for (const p of this.confettiParticles) p.opacity = Math.max(0, (p.opacity ?? 1) - 0.003);
      this.confettiParticles = this.confettiParticles.filter(p => p.y < window.innerHeight + 80 && (p.opacity ?? 1) > 0.02);

      if (this.confettiParticles.length === 0) {
        // done
        this.stopConfetti();
        return;
      }
      this.confettiRaf = requestAnimationFrame(draw);
    };

    // focus the message for assistive tech
    setTimeout(() => {
      const el = document.getElementById('celebration-message');
      if (el) (el as HTMLElement).focus();
    }, 300);

    this.confettiRaf = requestAnimationFrame(draw);
  }

  private stopConfetti() {
    if (this.confettiRaf) cancelAnimationFrame(this.confettiRaf);
    this.confettiRaf = 0;
    this.confettiParticles = [];
    if (this.confettiBurstInterval) { clearInterval(this.confettiBurstInterval); this.confettiBurstInterval = 0; }

    // remove/stop the canvas immediately
    this._confettiActive.set(false);

    // start celebration message exit animation, then hide it when done
    if (typeof window !== 'undefined') {
      this._celebrationExiting.set(true);
      // duration should be slightly longer than the CSS hide animation to ensure clean removal
      this.celebrationHideTimer = window.setTimeout(() => {
        this._celebrationExiting.set(false);
        this._celebrationShown.set(false);
        this.celebrationHideTimer = 0;
      }, 2500);
    } else {
      this._celebrationExiting.set(false);
      this._celebrationShown.set(false);
    }

    // clear canvas if present
    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  getTiles(): Tile[][] {
    // Lock all challenge tiles on load
    return tilesData.map(row =>
      row.map(tile => tile.challenge ? { ...tile, locked: true } : { ...tile })
    );
  }

  onTileChecked(tile: Tile, checked: boolean) {
    // update the board state so checked status persists
    this._tiles.update(rows => rows.map(row => row.map(t => t.id === tile.id ? { ...t, checked } : t)));
    // update challenge tile locks
    this.updateChallengeLocks();
    // persist the checked ids immediately
    this.saveCheckedToStorage();
  }
  /**
   * Unlock challenge tiles in a row/column if all non-challenge tiles are checked,
   * relock if any are unchecked.
   */
  private updateChallengeLocks() {
    const rows = this._tiles();
    const size = rows.length;
    // Deep copy to avoid mutation
    const updated = rows.map(row => row.map(tile => ({ ...tile })));

    // Helper to check if all non-challenge tiles in a row/col are checked
    const allNonChallengeChecked = (tiles: Tile[]) =>
      tiles.filter(t => !t.challenge && !t.fun).every(t => t.checked);

    // Update challenge tiles in rows
    for (let r = 0; r < size; r++) {
      if (allNonChallengeChecked(updated[r])) {
        for (let c = 0; c < updated[r].length; c++) {
          if (updated[r][c].challenge) updated[r][c].locked = false;
        }
      } else {
        for (let c = 0; c < updated[r].length; c++) {
          if (updated[r][c].challenge) updated[r][c].locked = true;
        }
      }
    }

    // Update challenge tiles in columns
    for (let c = 1; c < size; c++) {
      const col = updated.map(row => row[c]);
      if (allNonChallengeChecked(col)) {
        for (let r = 0; r < size; r++) {
          if (updated[r][c].challenge) updated[r][c].locked = false;
        }
      } else {
        for (let r = 0; r < size; r++) {
          if (updated[r][c].challenge) updated[r][c].locked = true;
        }
      }
    }

    this._tiles.set(updated);
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
