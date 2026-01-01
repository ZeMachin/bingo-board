import { Component, ChangeDetectionStrategy, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-bingo-tile',
  template: `
    <button
      class="tile-button"
      type="button"
      (click)="toggle()"
      (keydown)="onKeydown($event)"
      [attr.aria-pressed]="isFlipped()"
      [attr.aria-label]="ariaLabel"
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
        </div>
        <div class="tile-face tile-back">
          <div class="description">{{ description }}</div>
        </div>
      </div>
    </button>
  `,
  styles: [`
    :host { display: block; font-family: inherit; }

    /* Button container */
    .tile-button { background: transparent; border: none; padding: 0; cursor: pointer; perspective: 800px; width: 100%; height: 100%; display:block; }

    /* Inner 3D flip */
    .tile-inner { position: relative; width: 100%; height: 0; padding-bottom: 100%; transition: transform 400ms; transform-style: preserve-3d; }
    .tile-inner.flipped { transform: rotateY(180deg); }

    /* Faces */
    .tile-face { position: absolute; top:0; left:0; right:0; bottom:0; display:flex; align-items:center; justify-content:center; backface-visibility: hidden; overflow:hidden; }

    /* Front: show image with beveled border */
    .tile-front { background: linear-gradient(180deg, rgba(245,235,200,1), rgba(230,215,175,1)); border-left:4px solid rgba(0,0,0,0.12); border-top:4px solid rgba(255,255,255,0.08); box-shadow: inset -4px -4px 0 rgba(0,0,0,0.06); }

    /* Back: parchment description */
    .tile-back { background: linear-gradient(180deg, #faefd9, #efe1b8); transform: rotateY(180deg); padding: 0.75rem; box-sizing: border-box; text-align: center; border-left:4px solid rgba(0,0,0,0.12); }

    /* Decorative gold accent line */
    .tile-back::before { content: ''; position: absolute; left: 8px; right: 8px; height: 6px; top: 6px; background: linear-gradient(90deg, rgba(212,175,55,1), rgba(255,220,120,1)); box-shadow: 0 1px 0 rgba(0,0,0,0.25); border-radius: 2px; }

    /* Description text */
    .description { font-size: 0.7rem; color: var(--osrs-text); padding: 0.5rem; line-height: 1.2; text-shadow: 0 1px 0 rgba(255,255,255,0.4); }

    /* Image styles */
    img { display:block; width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; }

    /* Focus ring for accessibility, pixel style */
    .tile-button:focus { outline: none; box-shadow: 0 0 0 3px rgba(212,175,55,0.2), 0 4px 0 rgba(0,0,0,0.2); }
  `],
  imports: [CommonModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BingoTileComponent {
  @Input() image = 'https://via.placeholder.com/300';
  @Input() alt = 'Bingo tile image';
  @Input() description = 'Description';

  ariaLabel = 'Bingo tile';

  private flipped = signal(false);

  isFlipped() {
    return this.flipped();
  }

  toggle() {
    this.flipped.set(!this.flipped());
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle();
    }
  }
}
