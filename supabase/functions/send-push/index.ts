import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!

// Setup
const adminEmail = 'mailto:admin@qadaflow.app'
webpush.setVapidDetails(adminEmail, vapidPublicKey, vapidPrivateKey)
const supabase = createClient(supabaseUrl, supabaseKey)

// --- TEXTE & MOTIVATION ---
const MONDAY_QUOTES = [
  "Neue Woche, neue Barakah. Bismillah! 🌱",
  "Der beste Start in die Woche ist ein erledigtes Gebet.",
  "Konsistenz schlägt Intensität. Bleib dran!"
];

const FRIDAY_QUOTES = [
  "Jumu'ah Mubarak! Ein perfekter Tag für Fortschritt. 🕌",
  "Nutze den Segen des Freitags für deine Qada.",
  "Mach diesen Freitag zu einem Zeugen für dich."
];

const MILESTONES = {
  25: "Glückwunsch! Du hast 1/4 geschafft! 🥉",
  50: "Die Hälfte ist erledigt! Mashallah! 🥈",
  75: "Endspurt! 3/4 sind geschafft! 🥇",
  100: "Allahu Akbar! Du bist schuldenfrei! 🏆"
};

Deno.serve(async (req) => {
  try {
    // Wir empfangen Daten vom Cronjob oder vom Datenbank-Webhook
    const { record, type } = await req.json()
    
    let notifications = [] // Hier sammeln wir alle Nachrichten, die raus müssen

    // ==========================================
    // SZENARIO 1: CRONJOB (Montag & Freitag)
    // ==========================================
    if (type === 'WEEKLY_MOTIVATION') {
      const today = new Date();
      const day = today.getDay(); // 0=Sonntag, 1=Montag, ... 5=Freitag
      
      let quote = "";
      const title = "Qada' Flow Motivation 🌿";

      if (day === 1) quote = MONDAY_QUOTES[Math.floor(Math.random() * MONDAY_QUOTES.length)];
      else if (day === 5) quote = FRIDAY_QUOTES[Math.floor(Math.random() * FRIDAY_QUOTES.length)];
      
      // Nur senden, wenn es wirklich Montag oder Freitag ist (Sicherheits-Check)
      if (quote) {
        // Alle User holen, die Push aktiviert haben
        const { data: subs } = await supabase.from('push_subscriptions').select('user_id');
        if (subs) {
          // Doppelte User-IDs entfernen (falls einer Handy + Laptop hat, bekommt er trotzdem nur 1 Logik-Eintrag hier)
          const uniqueUsers = [...new Set(subs.map(s => s.user_id))];
          notifications = uniqueUsers.map(uid => ({ userId: uid, title, body: quote }));
        }
      }
    }

    // ==========================================
    // SZENARIO 2: MEILENSTEIN (Datenbank Trigger)
    // ==========================================
    // record existiert nur, wenn der Aufruf vom DB-Webhook kommt
    else if (record && record.amount < 0) {
      const userId = record.user_id;
      const justCompleted = Math.abs(record.amount); 

      // Wir rufen die SQL-Funktion auf, die wir in Schritt 1.1 erstellt haben
      const { data: stats } = await supabase.rpc('get_user_total_stats', { uid: userId });

      // Check: Haben wir Daten bekommen? (stats ist ein Array)
      if (stats && stats[0]) {
        const totalDone = stats[0].total_done;     
        const totalOpen = stats[0].total_open;     
        const totalGoal = totalDone + totalOpen; 

        if (totalGoal > 0) {
          // Mathe: Wo stehen wir jetzt? Wo waren wir vor dem Eintrag?
          const currentPercent = (totalDone / totalGoal) * 100;
          const prevPercent = ((totalDone - justCompleted) / totalGoal) * 100;

          // Prüfen, ob wir eine Schwelle (25, 50, 75, 100) überschritten haben
          const thresholds = [25, 50, 75, 100];
          
          for (const t of thresholds) {
            // Logik: War ich vorher unter X% und bin jetzt drüber?
            if (prevPercent < t && currentPercent >= t) {
              notifications.push({
                userId: userId,
                title: "Meilenstein erreicht! 🎉",
                body: MILESTONES[t as keyof typeof MILESTONES] || `Du hast ${t}% erreicht!`
              });
              break; // Nur den höchsten Meilenstein feiern, nicht mehrere gleichzeitig
            }
          }
        }
      }
    }

    // ==========================================
    // SENDEN (An Google/Apple Server schicken)
    // ==========================================
    if (notifications.length === 0) {
      return new Response(JSON.stringify({ message: "Nichts zu senden" }), { headers: { "Content-Type": "application/json" } });
    }

    const results = [];
    
    for (const notif of notifications) {
      // Jetzt holen wir die echten Browser-Keys für diesen User
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', notif.userId);

      if (subs) {
        for (const sub of subs) {
          try {
            await webpush.sendNotification(sub.subscription, JSON.stringify({
              title: notif.title,
              body: notif.body,
              icon: "/assets/icons/icon-192x192.png", // Stelle sicher, dass dieses Icon existiert!
              badge: "/assets/icons/icon-72x72.png"
            }));
            results.push({ user: notif.userId, status: 'sent' });
          } catch (err) {
             console.error(`Fehler bei User ${notif.userId}`, err);
             // Fehler 410 = User hat Abo gelöscht oder Berechtigung entzogen -> Aus DB löschen
             if (err.statusCode === 410) {
               await supabase.from('push_subscriptions').delete().match({ subscription: sub.subscription });
             }
          }
        }
      }
    }

    return new Response(JSON.stringify({ sent: results.length }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
})