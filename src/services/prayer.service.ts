import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

export interface PrayerTime {
  name: string;
  time: string; // HH:MM format
  isNext: boolean;
  isSunrise?: boolean; // New flag to distinguish Sunrise from Salah
}

interface AladhanResponse {
  data: {
    timings: {
      Fajr: string;
      Sunrise: string;
      Dhuhr: string;
      Asr: string;
      Maghrib: string;
      Isha: string;
      [key: string]: string;
    }
  }
}

interface NominatimResponse {
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country: string;
  };
  lat: string;
  lon: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrayerService {
  private http = inject(HttpClient);
  
  readonly prayerTimes = signal<PrayerTime[]>([]);
  readonly locationName = signal<string>('Loading location...');
  readonly isLoading = signal<boolean>(true);

  constructor() {
    // Initial load using auto-detect
    this.refreshLocation();
  }

  public refreshLocation() {
    this.isLoading.set(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.resolveCityFromCoords(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Geolocation denied or failed, using fallback.', error);
          this.fetchPrayerTimes('Rosenheim', 'Germany');
        }
      );
    } else {
      this.fetchPrayerTimes('Rosenheim', 'Germany');
    }
  }

  // New: Public method to search for cities
  public searchCity(query: string) {
    // Using Nominatim for free text search
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`;
    return this.http.get<NominatimResponse[]>(url);
  }

  // New: Public method to manually set location from search results
  public useManualLocation(city: string, country: string) {
    this.isLoading.set(true);
    this.fetchPrayerTimes(city, country);
  }

  private resolveCityFromCoords(lat: number, lon: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    
    this.http.get<NominatimResponse>(url).pipe(
      catchError(err => {
        console.error('Reverse Geocoding failed', err);
        return of(null);
      })
    ).subscribe(data => {
      if (data && data.address) {
        // Nominatim can return city, town, village, or even state district
        const city = data.address.city || data.address.town || data.address.village || data.address.state || 'Unknown City';
        const country = data.address.country || 'Germany';
        this.fetchPrayerTimes(city, country);
      } else {
        this.fetchPrayerTimes('Rosenheim', 'Germany');
      }
    });
  }

  private fetchPrayerTimes(city: string, country: string) {
    // Format date as DD-MM-YYYY for Aladhan API
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    const dateStr = `${d}-${m}-${y}`;

    // Update Location Name UI immediately
    this.locationName.set(`${city}, ${country}`);

    // Call Aladhan API with Method 13 (Diyanet)
    const apiUrl = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${city}&country=${country}&method=13`;

    this.http.get<AladhanResponse>(apiUrl).pipe(
      catchError(err => {
        console.error('Aladhan API failed', err);
        return of(null);
      })
    ).subscribe(response => {
      if (response && response.data && response.data.timings) {
        this.processTimings(response.data.timings);
      } else {
        this.generateStaticFallback();
      }
      this.isLoading.set(false);
    });
  }

  private processTimings(timings: any) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Added Sunrise to the order
    const order = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    
    let nextFound = false;
    
    const formatted: PrayerTime[] = order.map(name => {
      const rawTime = timings[name].split(' ')[0]; 
      const [hStr, mStr] = rawTime.split(':');
      const timeMinutes = parseInt(hStr) * 60 + parseInt(mStr);
      
      let isNext = false;
      // Sunrise is not the "next prayer" to perform, but we might want to highlight it if it's the next event.
      // However, usually "Next Prayer" refers to Salah.
      // For simplicity, we treat Sunrise as a time marker. If it's next, we highlight it, 
      // but users understand it's the end of Fajr.
      if (!nextFound && timeMinutes > currentMinutes) {
        isNext = true;
        nextFound = true;
      }

      return {
        name: name,
        time: rawTime,
        isNext,
        isSunrise: name === 'Sunrise'
      };
    });

    if (!nextFound && formatted.length > 0) {
       formatted[0].isNext = true; // Loop back to Fajr
    }

    this.prayerTimes.set(formatted);
  }

  private generateStaticFallback() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeVal = currentHour * 60 + currentMin;

    const rawTimes = [
      { name: 'Fajr', h: 5, m: 30 },
      { name: 'Sunrise', h: 7, m: 10, isSunrise: true },
      { name: 'Dhuhr', h: 13, m: 15 },
      { name: 'Asr', h: 16, m: 45 },
      { name: 'Maghrib', h: 19, m: 50 },
      { name: 'Isha', h: 21, m: 30 }
    ];

    let nextFound = false;
    const formatted: PrayerTime[] = rawTimes.map(t => {
      const timeVal = t.h * 60 + t.m;
      let isNext = false;
      if (!nextFound && timeVal > currentTimeVal) {
        isNext = true;
        nextFound = true;
      }
      return {
        name: t.name,
        time: `${t.h.toString().padStart(2, '0')}:${t.m.toString().padStart(2, '0')}`,
        isNext,
        isSunrise: !!t.isSunrise
      };
    });
    if (!nextFound && formatted.length > 0) formatted[0].isNext = true;
    
    this.prayerTimes.set(formatted);
    this.locationName.set('Rosenheim (Offline)');
  }
}