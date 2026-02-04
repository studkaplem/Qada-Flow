import { Component, ElementRef, ViewChild, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

declare var d3: any;

@Component({
  selector: 'app-garden',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `],
  template: `
    <div class="relative w-full h-80 overflow-hidden rounded-2xl shadow-inner bg-gradient-to-b from-sky-200 to-sky-50 border border-slate-100 group">
      <!-- D3 Container -->
      <div #gardenContainer class="w-full h-full absolute inset-0 z-10"></div>
      
      <!-- Overlay Text -->
      <div class="absolute top-4 left-6 z-20 pointer-events-none">
        <h3 class="text-emerald-900 font-bold text-lg opacity-80 shadow-white drop-shadow-md">{{ 'dashboard.garden_title' | translate }}</h3>
        <p class="text-emerald-800 text-xs font-medium opacity-70">{{ 'dashboard.garden_subtitle' | translate }}</p>
      </div>

      <!-- Empty State -->
      @if (plantCount() === 0) {
        <div class="absolute inset-0 flex flex-col items-center justify-center text-emerald-800/40 z-0">
           <i class="fa-solid fa-seedling text-4xl mb-2"></i>
           <p class="text-sm font-medium">{{ 'dashboard.garden_empty' | translate }}</p>
        </div>
      }
      
      <!-- Interactive Hint -->
      <div class="absolute bottom-2 right-4 text-[10px] text-emerald-800/50 italic opacity-0 group-hover:opacity-100 transition-opacity z-20">
        {{ 'dashboard.garden_hint' | translate }}
      </div>
    </div>
  `
})
export class GardenComponent implements OnDestroy {
  completedCount = input.required<number>();
  @ViewChild('gardenContainer') containerRef!: ElementRef;

  // Fix: plantCount must be a signal to be used as plantCount() in template
  plantCount = signal(0);

  constructor() {
    effect(() => {
      const total = this.completedCount();
      // Calculate plants: 1 plant per 10 prayers
      this.plantCount.set(Math.floor(total / 10));
      
      // Delay render to ensure view is ready
      setTimeout(() => {
        if (this.containerRef) {
          this.drawGarden();
        }
      }, 50); // Increased timeout slightly for DOM stability
    });
  }

  ngOnDestroy() {
     // Check existence before selecting
     if (this.containerRef?.nativeElement) {
        d3.select(this.containerRef.nativeElement).selectAll('*').remove();
     }
  }

  seededRandom(seed: number) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  drawGarden() {
    const el = this.containerRef.nativeElement;
    // Robust width/height calculation
    const width = el.clientWidth || 600;
    const height = el.clientHeight || 320;

    d3.select(el).selectAll('*').remove();

    const svg = d3.select(el)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid slice');

    // --- 1. Draw Background Landscape (Hills) ---
    const groundGradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "groundGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    groundGradient.append("stop").attr("offset", "0%").attr("stop-color", "#86efac"); // emerald-300
    groundGradient.append("stop").attr("offset", "100%").attr("stop-color", "#059669"); // emerald-600

    // Back Hill
    svg.append('path')
      .attr('d', `M0,${height * 0.6} C${width * 0.3},${height * 0.5} ${width * 0.7},${height * 0.7} ${width},${height * 0.6} L${width},${height} L0,${height} Z`)
      .attr('fill', '#bbf7d0') // lighter
      .attr('opacity', 0.8);

    // Front Hill
    svg.append('path')
      .attr('d', `M0,${height * 0.75} C${width * 0.4},${height * 0.85} ${width * 0.6},${height * 0.65} ${width},${height * 0.8} L${width},${height} L0,${height} Z`)
      .attr('fill', 'url(#groundGradient)');

    // --- 2. Generate Plants ---
    const count = this.plantCount();
    const plants = [];
    const maxPlants = Math.min(count, 300); // Performance cap

    for (let i = 0; i < maxPlants; i++) {
      const r1 = this.seededRandom(i * 123);
      const r2 = this.seededRandom(i * 456);
      const r3 = this.seededRandom(i * 789);

      const yNorm = r1; 
      const horizonY = height * 0.55;
      const y = horizonY + (yNorm * (height - horizonY - 20));
      const x = r2 * width;
      const type = Math.floor(r3 * 3);
      const scale = 0.5 + (yNorm * 0.8);

      plants.push({ x, y, type, scale, id: i });
    }

    plants.sort((a, b) => a.y - b.y);

    // --- 3. Draw Plants ---
    const gardenGroup = svg.append('g');

    const items = gardenGroup.selectAll('.plant')
      .data(plants, (d: any) => d.id)
      .enter()
      .append('g')
      .attr('class', 'plant')
      .attr('transform', (d: any) => `translate(${d.x}, ${d.y}) scale(0)`)
      .attr('opacity', 0.9);

    items.transition()
      .duration(800)
      .delay((d: any, i: number) => i * 10)
      .ease(d3.easeBackOut)
      .attr('transform', (d: any) => `translate(${d.x}, ${d.y}) scale(${d.scale})`);

    items.each(function(d: any) {
       const g = d3.select(this);
       if (d.type === 0) {
         g.append('path').attr('d', 'M0,-40 Q10,-10 0,0 Q-10,-10 0,-40').attr('fill', '#065f46');
         g.append('rect').attr('x', -2).attr('y', 0).attr('width', 4).attr('height', 5).attr('fill', '#78350f');
       } 
       else if (d.type === 1) {
         g.append('circle').attr('r', 15).attr('cy', -20).attr('fill', '#10b981');
         g.append('rect').attr('x', -3).attr('y', -5).attr('width', 6).attr('height', 10).attr('fill', '#78350f');
       } 
       else {
         g.append('path').attr('d', 'M-15,0 Q-10,-15 0,-10 Q10,-15 15,0 Z').attr('fill', '#34d399'); 
       }
    });
  }
}