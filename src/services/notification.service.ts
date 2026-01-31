import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private swPush = inject(SwPush);
  private auth = inject(AuthService);
  private supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

  /**
   * Fragt den User um Erlaubnis und speichert das Abo in der DB.
   * Sollte durch einen Button-Klick ausgelöst werden (z.B. im Profil).
   */
  async subscribeToNotifications() {
    // 1. Check: Unterstützt der Browser/ServiceWorker Push?
    if (!this.swPush.isEnabled) {
      console.warn('Push Notifications sind nicht verfügbar (kein SW oder Browser support)');
      alert("Dein Browser oder Gerät unterstützt keine Push-Nachrichten oder du bist im Inkognito-Modus.");
      return;
    }

    try {
      // Wir bereinigen den Key, damit Chrome ihn akzeptiert (Base64URL -> Base64)
      let key = environment.vapidPublicKey.trim(); // Leerzeichen/Newlines weg
      
      // 2. Browser Popup: "Darf Qada Flow dir Nachrichten senden?"
      const sub = await this.swPush.requestSubscription({
        serverPublicKey: key
      });

      // 3. User ID holen
      const user = this.auth.currentUser();
      if (!user) {
          console.error("User nicht eingeloggt, kann Subscription nicht speichern.");
          return;
      }

      // 4. In Supabase speichern
      const { error } = await this.supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: sub.toJSON(),
          user_agent: navigator.userAgent 
        }, { onConflict: 'user_id, subscription' });
      
      if (error) {
          console.error('Fehler beim Speichern der Subscription:', error);
      } else {
          console.log('Erfolgreich für Push registriert!');
          alert("Erfolgreich aktiviert! Du erhältst nun Motivation an Montagen und Freitagen.");
      }

    } catch (err) {
      console.error('Konnte keine Push-Erlaubnis erhalten', err);
      // Hier geben wir dem User Feedback, falls es immer noch klemmt
      alert("Konnte keine Erlaubnis erhalten. Bitte prüfe, ob Benachrichtigungen für diese Seite blockiert sind.");
    }
  }
}