import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.3'

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
    console.log("--> Request erhalten!");

    // Prüfen ob Body leer ist
    if (!req.body) {
        return new Response("No body", { status: 400 });
    }

    const body = await req.json();
    console.log("Payload Type:", body.type);

    const { record, type } = body;
    let notifications = [];

    // --- FALL 1: CRONJOB ---
    if (type === 'WEEKLY_MOTIVATION') {
      console.log("Typ: Weekly Motivation");
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

    // --- FALL 2: MEILENSTEIN (Webhook) ---
    else if (record) {
      console.log(`Typ: Webhook Insert. Amount: ${record.amount}`);

      if (record.amount < 0) {
        const userId = record.user_id;
        const justCompleted = Math.abs(record.amount);

        // RPC Aufruf
        const { data: stats, error } = await supabase.rpc('get_user_total_stats', { uid: userId });

        if (error) {
           console.error("RPC Error:", error);
           return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        console.log("Stats:", stats); // Debug 3

        if (stats && stats[0]) {
          const totalDone = Number(stats[0].total_done);
          const totalOpen = Number(stats[0].total_open);
          const totalGoal = totalDone + totalOpen;

          console.log(`Mathe: Done=${totalDone}, Goal=${totalGoal}`); // Debug 4

          if (totalGoal > 0) {
            const currentPercent = (totalDone / totalGoal) * 100;
            const prevPercent = ((totalDone - justCompleted) / totalGoal) * 100;

            console.log(`Sprung: ${prevPercent.toFixed(2)}% -> ${currentPercent.toFixed(2)}%`); // Debug 5

            const thresholds = [25, 50, 75, 100];
            
            for (const t of thresholds) {
              if (prevPercent < t && currentPercent >= t) {
                console.log(`TREFFER! ${t}% erreicht.`);
                notifications.push({
                  userId: userId,
                  title: "Meilenstein erreicht! 🎉",
                  body: MILESTONES[t as keyof typeof MILESTONES] || `Du hast ${t}% erreicht!`
                });
                break; 
              }
            }
          }
        }
      }
    }

    if (notifications.length === 0) {
      console.log("--> Nichts zu senden.");
      return new Response(JSON.stringify({ message: "Kein Trigger" }), { headers: { "Content-Type": "application/json" } });
    }

    // --- SENDEN ---
    console.log(`Sende ${notifications.length} Nachrichten...`);
    const results = [];
    
    for (const notif of notifications) {
      const { data: subs } = await supabase.from('push_subscriptions').select('subscription').eq('user_id', notif.userId);
      if (subs) {
        for (const sub of subs) {
          try {
            await webpush.sendNotification(sub.subscription, JSON.stringify({
              title: notif.title,
              body: notif.body,
              icon: "/assets/icons/icon-192x192.png",
              badge: "/assets/icons/icon-72x72.png"
            }));
            results.push({ user: notif.userId, status: 'sent' });
            console.log("Push gesendet!");
          } catch (err) {
            console.error("Push Fehler:", err);
            if (err.statusCode === 410) {
               await supabase.from('push_subscriptions').delete().match({ subscription: sub.subscription });
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ sent: results.length }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    console.error("CRITICAL CRASH:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
})