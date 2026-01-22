import { Component, ElementRef, ViewChild, effect, inject, signal, HostListener, OnDestroy } from '@angular/core';
import { StoreService, PrayerCounts } from '../services/store.service';
import { PrayerService } from '../services/prayer.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GardenComponent } from './garden.component';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../pipes/translate.pipe';

declare var d3: any;

type ChartType = 'bar' | 'radial' | 'trend' | 'heatmap' | 'radar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, GardenComponent, RouterLink, TranslatePipe],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnDestroy {
  store = inject(StoreService);
  prayerService = inject(PrayerService);

  @ViewChild('chartContainer') chartContainer!: ElementRef;

  // Plan Adjustment State
  isPlanModalOpen = signal(false);
  tempCapacity = signal(1);
  tempTargetDate = signal('');

  // Manual Edit State
  isEditModalOpen = signal(false);

  // Location Search State
  isSearchModalOpen = signal(false);
  searchQuery = signal('');
  searchResults = signal<any[]>([]);
  isSearching = signal(false);
  
  // Chart State
  chartMode = signal<ChartType>('bar');
  
  // Habit Stacking Logic
  habitTrigger = signal('fard_dhuhr');
  habitAction = signal('set_1');

  // Helper for templates
  prayerTypes: (keyof PrayerCounts)[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'witr'];

  constructor() {
    // Re-draw chart when data changes or mode changes
    effect(() => {
      const missed = this.store.missedPrayers();
      const completed = this.store.completedPrayers();
      const history = this.store.history();
      const khushu = this.store.khushuStats();
      const mode = this.chartMode();
      
      // Delay slightly to ensure container has rendered dimensions
      setTimeout(() => {
         if (this.chartContainer) {
            this.renderChart(mode, missed, completed, history, khushu);
         }
      }, 50);
    });

    // Initialize temp capacity when modal opens
    effect(() => {
        if(this.isPlanModalOpen()) {
            this.tempCapacity.set(this.store.userSettings().dailyCapacity);
            this.tempTargetDate.set(''); 
        }
    });
  }

  ngOnDestroy() {
    // Cleanup any lingering tooltips when leaving the component
    d3.selectAll('.d3-chart-tooltip').remove();
  }

  // Listen for window resize to redraw charts responsively
  @HostListener('window:resize')
  onResize() {
    this.renderChart(
        this.chartMode(), 
        this.store.missedPrayers(), 
        this.store.completedPrayers(),
        this.store.history(),
        this.store.khushuStats()
    );
  }

  refreshLocation() {
    this.prayerService.refreshLocation();
  }

  // --- Location Search Logic ---
  openSearchModal() {
    this.isSearchModalOpen.set(true);
    this.searchQuery.set('');
    this.searchResults.set([]);
  }

  closeSearchModal() {
    this.isSearchModalOpen.set(false);
  }

  searchLocation() {
    const q = this.searchQuery();
    if (!q || q.length < 2) return;

    this.isSearching.set(true);
    this.prayerService.searchCity(q).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.isSearching.set(false);
      },
      error: () => {
        this.isSearching.set(false);
      }
    });
  }

  selectLocation(result: any) {
    // Nominatim returns address object. We need city/town and country.
    // Sometimes city is under 'town', 'village', 'state' etc.
    const city = result.address.city || result.address.town || result.address.village || result.address.state?.split(' ')[0] || 'Unknown';
    const country = result.address.country || 'Unknown';
    
    this.prayerService.useManualLocation(city, country);
    this.closeSearchModal();
  }

  renderChart(mode: ChartType, missed: any, completed: any, history: any, khushu: any) {
    if (mode === 'bar') this.drawBarChart(missed, completed);
    else if (mode === 'radial') this.drawRadialChart(missed, completed);
    else if (mode === 'trend') this.drawTrendChart(history);
    else if (mode === 'heatmap') this.drawHeatmap(history);
    else if (mode === 'radar') this.drawRadarChart(khushu);
  }

  // --- Modal Logic ---
  openPlanModal() { this.isPlanModalOpen.set(true); }
  closePlanModal() { this.isPlanModalOpen.set(false); }
  
  openEditModal() { this.isEditModalOpen.set(true); }
  closeEditModal() { this.isEditModalOpen.set(false); }

  savePlanAdjustment() {
    this.store.updateDailyCapacity(this.tempCapacity());
    this.closePlanModal();
  }

  adjustPrayerCount(type: keyof PrayerCounts, amount: number) {
    this.store.adjustMissedPrayer(type, amount);
  }

  // Habit Stacking
  saveHabitRule() {
    this.store.updateHabitRule(this.habitTrigger(), this.habitAction());
  }

  // Helper to access signal data safely in template
  getMissedCount(type: string): number {
    const counts = this.store.missedPrayers();
    return (counts as any)[type] || 0;
  }

  // --- Chart Logic ---

  toggleChartMode(mode: ChartType) {
    this.chartMode.set(mode);
  }

  calculateCapacityFromDate(dateStr: string) {
    if (!dateStr) return;
    const targetDate = new Date(dateStr);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return; 

    const totalRemainingPrayers = this.store.totalMissed();
    const totalSets = Math.ceil(totalRemainingPrayers / 6);
    const requiredDaily = Math.ceil(totalSets / diffDays);
    this.tempCapacity.set(requiredDaily);
  }

  onDateChange(event: Event) {
      const val = (event.target as HTMLInputElement).value;
      this.tempTargetDate.set(val);
      this.calculateCapacityFromDate(val);
  }

  // --- D3 Renderers ---

  resetChart(el: any) {
    // Only remove SVG elements created by D3, try to preserve other content if possible
    d3.select(el).selectAll('svg').remove();
    d3.select(el).style('height', null);
    d3.selectAll('.d3-chart-tooltip').remove();
  }

  drawBarChart(missed: any, completed: any) {
    const el = this.chartContainer.nativeElement;
    this.resetChart(el);

    const groups = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'];
    const subgroups = ['completed', 'remaining'];

    const data = groups.map(name => ({
      group: name,
      completed: (completed as any)[name.toLowerCase()] || 0,
      remaining: (missed as any)[name.toLowerCase()] || 0
    }));

    const containerHeight = el.getBoundingClientRect().height || 400; 
    // Fix: Robust Width Calculation
    const containerWidth = el.clientWidth || 600;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 }; 
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = d3.select(el)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(groups).range([0, width]).padding(0.2);
    const y = d3.scaleLinear()
      .domain([0, (d3.max(data, (d: any) => Math.max(d.completed, d.remaining)) || 10) * 1.1])
      .range([height, 0]);

    svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).tickSize(0)).attr('class', 'text-slate-500 font-medium').select('.domain').remove();
    svg.append('g').call(d3.axisLeft(y).ticks(5)).attr('class', 'text-slate-400').select('.domain').remove();

    const xSubgroup = d3.scaleBand().domain(subgroups).range([0, x.bandwidth()]).padding(0.05);
    const color = d3.scaleOrdinal().domain(subgroups).range(['#10b981', '#f87171']);

    svg.append('g').selectAll('g').data(data).enter().append('g')
        .attr('transform', (d: any) => `translate(${x(d.group)},0)`)
      .selectAll('rect').data((d: any) => subgroups.map(key => ({ key, value: d[key] })))
      .enter().append('rect')
        .attr('x', (d: any) => xSubgroup(d.key))
        .attr('y', (d: any) => y(d.value))
        .attr('width', xSubgroup.bandwidth())
        .attr('height', (d: any) => height - y(d.value))
        .attr('fill', (d: any) => color(d.key))
        .attr('rx', 4);
  }

  drawRadialChart(missed: any, completed: any) {
    const el = this.chartContainer.nativeElement;
    this.resetChart(el);

    const groups = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'];
    const containerWidth = el.clientWidth || 600;

    // Dynamic columns based on width
    let cols = 3;
    if (containerWidth > 1000) cols = 6;
    else if (containerWidth < 600) cols = 2;
    else cols = 3;

    const rows = Math.ceil(groups.length / cols);
    
    // Calculate size
    const availableWidthPerCol = containerWidth / cols;
    // Cap max radius size for aesthetics
    const cellSize = Math.min(250, availableWidthPerCol);
    
    // Explicit heights for chart and labels
    const radius = (cellSize / 2) * 0.65; 
    const labelHeight = 50; 
    const rowHeight = (radius * 2) + labelHeight + 20; // + Padding
    
    const totalHeight = rows * rowHeight; 
    
    d3.select(el).style('height', `${totalHeight}px`);

    const svg = d3.select(el)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', totalHeight);

    const data = groups.map(name => {
      const m = (missed as any)[name.toLowerCase()] || 0;
      const c = (completed as any)[name.toLowerCase()] || 0;
      const total = m + c;
      const percent = total === 0 ? 0 : (c / total);
      return { name, percent, total, completed: c };
    });

    const arc = d3.arc().innerRadius(radius * 0.75).outerRadius(radius).startAngle(0);
    const bgArc = d3.arc().innerRadius(radius * 0.75).outerRadius(radius).startAngle(0).endAngle(2 * Math.PI);

    const g = svg.selectAll('.gauge')
      .data(data).enter().append('g')
      .attr('transform', (d: any, i: number) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        // Center within the grid cell
        const xPos = (col * availableWidthPerCol) + (availableWidthPerCol / 2);
        const yPos = (row * rowHeight) + (rowHeight / 2) - 10;
        return `translate(${xPos}, ${yPos})`;
      });

    // Background Arc
    g.append('path').attr('d', bgArc).attr('fill', '#f1f5f9'); 

    // Progress Arc
    g.append('path')
      .attr('fill', (d: any) => d.percent === 1 ? '#10b981' : d.percent > 0.5 ? '#3b82f6' : '#f59e0b')
      .attr('d', (d: any) => arc({ endAngle: d.percent * 2 * Math.PI } as any))
      .attr('stroke', 'white').attr('stroke-width', '1px');

    // Labels
    g.append('text').attr('text-anchor', 'middle').attr('y', -5).attr('class', 'font-bold fill-slate-700').style('font-size', '14px').text((d: any) => d.name);
    g.append('text').attr('text-anchor', 'middle').attr('y', 15).attr('class', 'fill-slate-400').style('font-size', '12px').text((d: any) => `${Math.round(d.percent * 100)}%`);
    
    // Bottom Stats
    g.append('text').attr('text-anchor', 'middle').attr('y', radius + 25).attr('class', 'fill-slate-400 font-mono').style('font-size', '11px').text((d: any) => `${d.completed} / ${d.total}`);
  }

  drawTrendChart(history: {[date: string]: number}) {
    const el = this.chartContainer.nativeElement;
    this.resetChart(el);

    const containerHeight = el.getBoundingClientRect().height || 400;
    const containerWidth = el.clientWidth || 600;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Get last 14 days
    const days = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }

    const data = days.map(day => ({
        date: d3.timeParse("%Y-%m-%d")(day),
        value: history[day] || 0
    }));

    const svg = d3.select(el)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(data, (d: any) => d.date))
      .range([0, width]);

    // Max val + padding (min 5 for Y axis)
    const maxVal = Math.max(5, d3.max(data, (d: any) => d.value) || 0);
    const y = d3.scaleLinear()
      .domain([0, maxVal])
      .range([height, 0]);

    // Area
    const area = d3.area()
        .x((d: any) => x(d.date))
        .y0(height)
        .y1((d: any) => y(d.value))
        .curve(d3.curveMonotoneX);

    // Gradient
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "trendGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#10b981").attr("stop-opacity", 0.6);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#10b981").attr("stop-opacity", 0.05);

    // Draw Area
    svg.append("path")
        .datum(data)
        .attr("fill", "url(#trendGradient)")
        .attr("d", area);

    // Draw Line
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#10b981")
        .attr("stroke-width", 3)
        .attr("d", d3.line()
            .x((d: any) => x(d.date))
            .y((d: any) => y(d.value))
            .curve(d3.curveMonotoneX)
        );

    // Dots
    svg.selectAll("dot")
        .data(data)
        .enter().append("circle")
        .attr("cx", (d: any) => x(d.date))
        .attr("cy", (d: any) => y(d.value))
        .attr("r", 4)
        .attr("fill", "white")
        .attr("stroke", "#10b981")
        .attr("stroke-width", 2);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%b %d")))
        .attr("class", "text-slate-400")
        .select(".domain").remove();

    svg.append("g")
        .call(d3.axisLeft(y).ticks(5))
        .attr("class", "text-slate-400")
        .select(".domain").remove();
  }

  drawHeatmap(history: {[date: string]: number}) {
    const el = this.chartContainer.nativeElement;
    this.resetChart(el);

    const containerWidth = (el.clientWidth || 600) - 5;
    
    // We want squares. Size depends on container.
    // Display last 60 days approx? Or last 10 weeks.
    const cellSize = Math.floor((containerWidth - 40) / 15); // approx 15 cols
    const daysToShow = 70; // 10 weeks
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysToShow);
    
    // Generate date range
    const dates = [];
    for(let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
    }

    const height = 8 * cellSize + 20; // 7 days + padding
    d3.select(el).style('height', `${height}px`);

    const svg = d3.select(el)
      .append("svg")
      .attr("width", containerWidth)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(20, 20)`);

    // Helper to get formatted key
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    // Tooltip - ADD CLASS 'd3-chart-tooltip' to identify and remove it later
    const tooltip = d3.select('body').append('div')
        .attr('class', 'd3-chart-tooltip absolute bg-slate-800 text-white text-xs rounded p-2 opacity-0 pointer-events-none transition-opacity z-50 shadow-lg');

    // Draw Cells
    svg.selectAll("rect")
      .data(dates)
      .enter().append("rect")
      .attr("width", cellSize - 4)
      .attr("height", cellSize - 4)
      .attr("rx", 3)
      .attr("x", (d: Date, i: number) => Math.floor(i / 7) * cellSize)
      .attr("y", (d: Date) => d.getDay() * cellSize)
      .attr("fill", (d: Date) => {
          const val = history[fmt(d)] || 0;
          if (val === 0) return '#f1f5f9'; // slate-100
          if (val <= 2) return '#a7f3d0'; // emerald-200
          if (val <= 5) return '#34d399'; // emerald-400
          return '#059669'; // emerald-600
      })
      .on("mouseover", (event: any, d: Date) => {
          const val = history[fmt(d)] || 0;
          tooltip.transition().duration(200).style('opacity', 1);
          tooltip.html(`<strong>${d.toLocaleDateString()}</strong><br/>${val} Prayers`)
                 .style('left', (event.pageX + 10) + 'px')
                 .style('top', (event.pageY - 28) + 'px');
      })
      .on("mouseout", () => {
          tooltip.transition().duration(500).style('opacity', 0);
      });
  }

  drawRadarChart(khushu: any) {
    const el = this.chartContainer.nativeElement;
    this.resetChart(el);

    const containerHeight = el.getBoundingClientRect().height || 400;
    const containerWidth = el.clientWidth || 600;
    const margin = 40;
    const radius = Math.min(containerWidth, containerHeight) / 2 - margin;

    const svg = d3.select(el)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .append('g')
      .attr("transform", `translate(${containerWidth/2},${containerHeight/2})`);

    // Prepare Data
    const features = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'];
    const data = features.map(f => {
      const k = khushu[f.toLowerCase()] || {totalScore: 0, count: 0};
      // Avg score 1-3. If count 0, show 0.
      const avg = k.count > 0 ? k.totalScore / k.count : 0;
      return { axis: f, value: avg };
    });

    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 3]);
    const angleSlice = Math.PI * 2 / features.length;

    // Draw Grid (Concentric Circles)
    const axisGrid = svg.append("g").attr("class", "axisWrapper");
    
    // Levels: 1, 2, 3
    axisGrid.selectAll(".levels")
       .data([1, 2, 3])
       .enter().append("circle")
       .attr("class", "gridCircle")
       .attr("r", (d: number) => rScale(d))
       .style("fill", "#CDCDCD")
       .style("stroke", "#CDCDCD")
       .style("fill-opacity", 0.05);

    // Labels for Grid
    axisGrid.selectAll(".axisLabel")
       .data([1, 2, 3])
       .enter().append("text")
       .attr("x", 4)
       .attr("y", (d: number) => -rScale(d))
       .attr("dy", "0.4em")
       .style("font-size", "10px")
       .attr("fill", "#737373")
       .text((d: number) => d);

    // Draw Axes (Spokes)
    const axes = axisGrid.selectAll(".axis")
       .data(data)
       .enter().append("g")
       .attr("class", "axis");

    axes.append("line")
       .attr("x1", 0)
       .attr("y1", 0)
       .attr("x2", (d: any, i: number) => rScale(3) * Math.cos(angleSlice * i - Math.PI/2))
       .attr("y2", (d: any, i: number) => rScale(3) * Math.sin(angleSlice * i - Math.PI/2))
       .attr("class", "line")
       .style("stroke", "white")
       .style("stroke-width", "2px");

    // Axis Labels (Text)
    axes.append("text")
       .attr("class", "legend")
       .style("font-size", "11px")
       .attr("text-anchor", "middle")
       .attr("dy", "0.35em")
       .attr("x", (d: any, i: number) => rScale(3.4) * Math.cos(angleSlice * i - Math.PI/2))
       .attr("y", (d: any, i: number) => rScale(3.4) * Math.sin(angleSlice * i - Math.PI/2))
       .text((d: any) => d.axis);

    // Draw Radar Area
    const radarLine = d3.lineRadial()
       .curve(d3.curveLinearClosed)
       .radius((d: any) => rScale(d.value))
       .angle((d: any, i: number) => i * angleSlice);

    if (d3.sum(data, (d: any) => d.value) > 0) {
        svg.append("path")
           .attr("class", "radarArea")
           .attr("d", radarLine(data))
           .style("fill", "#10b981")
           .style("fill-opacity", 0.3)
           .style("stroke", "#059669")
           .style("stroke-width", "2px");
           
        // Draw Dots
        svg.selectAll(".radarCircle")
           .data(data)
           .enter().append("circle")
           .attr("class", "radarCircle")
           .attr("r", 4)
           .attr("cx", (d: any, i: number) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI/2))
           .attr("cy", (d: any, i: number) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI/2))
           .style("fill", "#10b981")
           .style("fill-opacity", 0.8);
    } else {
        svg.append("text")
           .attr("text-anchor", "middle")
           .attr("dy", "0.35em")
           .text("No Khushu data yet")
           .attr("fill", "#94a3b8");
    }
  }
}