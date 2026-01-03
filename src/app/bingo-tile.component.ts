import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-bingo-tile',
  template: `
    <div
      class="tile-button"
      [class.checked]="isChecked()"
      role="button"
      [attr.tabindex]="locked ? -1 : 0"
      (click)="toggle()"
      (keydown)="onKeydown($event)"
      [attr.aria-pressed]="isFlipped()"
      [attr.aria-disabled]="locked"
      [attr.aria-label]="ariaLabel + (locked ? ', locked' : '')"
    >
      <div class="tile-inner" [class.flipped]="isFlipped()">
        <div class="tile-face tile-front">
          <img
            [ngSrc]="image"
            [alt]="alt"
            width="300"
            height="300"
            decoding="async"
          />

          <!-- Check button (only when not locked) -->
          @if(!locked && !fun){<button
            class="check-button"
            type="button"
            [attr.aria-pressed]="isChecked()"
            [attr.aria-label]="isChecked() ? 'Unmark tile' : 'Mark tile as checked'"
            title="Mark tile"
            (click)="toggleCheck($event)"
          >
            ✓
          </button>}

          @if(locked){
            <div class="lock-overlay" role="img" aria-label="Locked tile">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="lock-icon">
                <path d="M6 9V7a6 6 0 0112 0v2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="3" y="9" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 14v2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          }
        </div>
        <div class="tile-face tile-back">
          <!-- info button (opens modal or for long descriptions) -->
          @if(tooltip || hasLongDescription()){
            <button
              class="info-button"
              type="button"
              aria-label="Tile details"
              title="Tile details"
              (click)="openInfo($event)"
            >
              ℹ️
            </button>
          }

          <div
            class="description"
            [innerHTML]="description"
            [class.long]="hasLongDescription()"
            role="region"
            [attr.aria-label]="title ? (title + ' description') : 'Tile description'"
            tabindex="0"
            (keydown)="onDescriptionKeydown($event)"
          ></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: inherit; }

    /* Button container (using role=button for accessibility) */
    .tile-button { background: transparent; border: none; padding: 0; cursor: pointer; perspective: 800px; width: 100%; height: 100%; display:block; }

    /* Inner 3D flip */
    .tile-inner { position: relative; width: 100%; height: 0; padding-bottom: 100%; transition: transform 400ms; transform-style: preserve-3d; }
    .tile-inner.flipped { transform: rotateY(180deg); }

    /* Faces */
    .tile-face { position: absolute; top:0; left:0; right:0; bottom:0; display:flex; align-items:center; justify-content:center; backface-visibility: hidden; overflow:hidden; }

    /* Front: show image with beveled border */
    .tile-front { background: linear-gradient(180deg, rgba(245,235,200,1), rgba(230,215,175,1)); border-left:4px solid rgba(0,0,0,0.12); border-top:4px solid rgba(255,255,255,0.08); box-shadow: inset -4px -4px 0 rgba(0,0,0,0.06); }

    /* Back: parchment description */
    .tile-back { background: linear-gradient(180deg, #faefd9, #efe1b8); transform: rotateY(180deg); padding: 0.75rem; box-sizing: border-box; text-align: center; border-left:4px solid rgba(0,0,0,0.12); position:relative; }

    /* Info button */
    .info-button {
      position: absolute;
      right: 6px;
      top: 6px;
      background: var(--osrs-accent);
      color: #111;
      border: 2px solid rgba(0,0,0,0.12);
      border-radius: 6px;
      padding: 0.15rem 0.35rem;
      font-size: 0.8rem;
      line-height: 1;
      z-index: 1;
      cursor: pointer;
    }

    .info-button:focus { outline: none; box-shadow: 0 0 0 3px rgba(212,175,55,0.25); }

    /* Check button */
    .check-button {
      position: absolute;
      right: 6px;
      top: 6px;
      background: transparent;
      color: rgba(0,0,0,0.85);
      border: 2px solid rgba(0,0,0,0.12);
      border-radius: 8px;
      padding: 0.12rem 0.3rem;
      font-size: 0.9rem;
      line-height: 1;
      z-index: 2;
      cursor: pointer;
    }
    .check-button.back { top: 6px; }
    .check-button:focus { outline: none; box-shadow: 0 0 0 3px rgba(46,204,113,0.18); }

    /* Checked highlight */
    .tile-button.checked .tile-front,
    .tile-button.checked .tile-back {
      box-shadow: inset 0 0 0 4px rgba(46,204,113,0.18), 0 6px 0 rgba(0,0,0,0.1);
      border-left-color: rgba(46,204,113,0.6);
    }

    .tile-button.checked .check-button {
      background: rgba(46,204,113,1);
      color: white;
      border-color: rgba(46,204,113,1);
    }

    /* Decorative gold accent line */
    .tile-back::before { content: ''; position: absolute; left: 8px; right: 8px; height: 6px; top: 6px; background: linear-gradient(90deg, rgba(212,175,55,1), rgba(255,220,120,1)); box-shadow: 0 1px 0 rgba(0,0,0,0.25); border-radius: 2px; }

    /* Description text */
    .description { font-size: 0.7rem; color: var(--osrs-text); padding: 0.5rem; line-height: 1.25; text-shadow: 0 1px 0 rgba(255,255,255,0.4); hyphens: auto; -webkit-hyphens: auto; overflow: hidden; }

    /* Long descriptions: make scrollable and left-aligned for readability */
    .description.long {
      text-align: left;
      max-height: calc(100% - 2rem); /* leave room for decorative header and buttons */
      overflow-y: auto;
      padding-right: 0.25rem; /* make room for scrollbar */
      position: relative;
      -webkit-overflow-scrolling: touch;
    }

    /* Subtle fade at the bottom when content scrolls */
    .description.long::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 2.4rem;
      pointer-events: none;
      background: linear-gradient(180deg, rgba(250,245,230,0) 0%, rgba(239,225,185,1) 100%);
    }

    /* Thin, unobtrusive scrollbar */
    .description.long::-webkit-scrollbar { width: 8px; }
    .description.long::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 4px; }
    .description.long::-webkit-scrollbar-track { background: transparent; }
    .description.long { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent; }

    /* Image styles */
    img { display:block; width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; }

    /* Focus ring for accessibility, pixel style */
    .tile-button:focus { outline: none; box-shadow: 0 0 0 3px rgba(212,175,55,0.2), 0 4px 0 rgba(0,0,0,0.2); }

    /* Lock overlay */
    .lock-overlay { position: absolute; inset: 0; display:flex; align-items:center; justify-content:center; pointer-events: none; }
    .lock-overlay::before { content: ''; position:absolute; inset: 0; background: rgba(0,0,0,0.28); }
    .lock-icon { position: relative; z-index: 1; color: #fff; width: 48px; height: 48px; filter: drop-shadow(0 2px 0 rgba(0,0,0,0.4)); }
  `],
  imports: [CommonModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BingoTileComponent {
  @Input() image = 'https://upload.wikimedia.org/wikipedia/commons/e/e0/PlaceholderLC.png';
  @Input() alt = 'Bingo tile image';
  @Input() description = 'Description';
  @Input() tooltip?: string;
  @Input() title?: string;
  @Input() locked = false;
  @Input() fun = false;
  // checked state is stored in a signal; expose an input setter so parent can set initial state
  private _checked = signal(false);
  @Input() set checked(v: boolean) { this._checked.set(!!v); }
  get checked() { return this._checked(); }

  @Output() info = new EventEmitter<{ title?: string; description: string; tooltip?: string; image?: string }>();
  @Output() checkedChange = new EventEmitter<boolean>();

  ariaLabel = 'Bingo tile';

  private flipped = signal(false);
  hasLongDescription = computed(() => (this.description ?? '').length > 80);

  isFlipped() {
    return this.flipped();
  }

  isChecked() { return this._checked(); }

  toggle() {
    if (this.locked) return;
    this.flipped.set(!this.flipped());
  }

  toggleCheck(event: Event) {
    // prevent flipping when clicking the check button
    event.stopPropagation();
    event.preventDefault();
    if (this.locked) return;
    const next = !this._checked();
    this._checked.set(next);
    this.checkedChange.emit(next);
  }

  openInfo(event: Event) {
    // prevent flipping when clicking the info button
    event.stopPropagation();
    event.preventDefault();
    this.info.emit({ title: this.title, description: this.description, tooltip: this.tooltip, image: this.image });
  }

  onKeydown(event: KeyboardEvent) {
    if (this.locked) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle();
    }
  }

  onDescriptionKeydown(event: KeyboardEvent) {
    // open the info modal when Enter/Space is pressed while focusing the description
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openInfo(event as unknown as Event);
    }
  }
}
