import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
const APP_URL = "https://qada-flow-d9vz.vercel.app"
const adminEmail = 'mailto:admin@qadaflow.app'

const I18N = {
  de: {
    monday_title: "Qada' Flow Motivation 🌿",
    friday_title: "Jumu'ah Mubarak 🕌",
    monday_quotes: [
      "Neue Woche, neue Barakah. Bismillah! 🌱",
      "Der beste Start in die Woche ist ein erledigtes Gebet.",
      "Konsistenz schlägt Intensität. Bleib dran!",
      "Ein Schritt auf Allah zu, und Er kommt dir entgegen."
    ],
    friday_quotes: [
      "Jumu'ah Mubarak! Ein perfekter Tag für Fortschritt. 🕌",
      "Nutze den Segen des Freitags für deine Qada.",
      "Mach diesen Freitag zu einem Zeugen für dich.",
      "Lass nicht zu, dass der Freitag vergeht ohne ein Kaza-Gebet."
    ],
    milestones: {
      title: "Meilenstein erreicht! 🎉",
      25: "Glückwunsch! Du hast 25% geschafft! 🥉",
      50: "Die Hälfte ist erledigt! MaschaAllah! 🥈",
      75: "Endspurt! 75% sind geschafft! 🥇",
      100: "Allahu Akbar! Du bist schuldenfrei! 🏆",
      fallback: (p: number) => `Du hast ${p}% deines Ziels erreicht!`
    }
  },
  en: {
    monday_title: "Qada' Flow Motivation 🌿",
    friday_title: "Jumu'ah Mubarak 🕌",
    monday_quotes: [
      "New week, new Barakah. Bismillah! 🌱",
      "The best start to the week is a completed prayer.",
      "Consistency beats intensity. Keep going!",
      "Take one step towards Allah, and He runs towards you."
    ],
    friday_quotes: [
      "Jumu'ah Mubarak! A perfect day for progress. 🕌",
      "Use the blessings of Friday for your Qada.",
      "Make this Friday a witness for you.",
      "Do not let Friday pass without a Qada prayer."
    ],
    milestones: {
      title: "Milestone Reached! 🎉",
      25: "Congratulations! You reached 25% of your goal! 🥉",
      50: "Halfway there! MashaAllah! 🥈",
      75: "Final sprint! 75% done! 🥇",
      100: "Allahu Akbar! You are debt-free! 🏆",
      fallback: (p: number) => `You reached ${p}% of your goal!`
    }
  },
  tr: {
    monday_title: "Qada' Flow Motivasyon 🌿",
    friday_title: "Hayırlı Cumalar 🕌",
    monday_quotes: [
      "Yeni hafta, yeni bereket. Bismillah! 🌱",
      "Haftaya en iyi başlangıç, kılınmış bir namazdır.",
      "İstikrar, yoğunluktan iyidir. Devam et!",
      "Allah'a bir adım at, O sana koşarak gelir."
    ],
    friday_quotes: [
      "Cumanız Mübarek Olsun! İlerleme için harika bir gün. 🕌",
      "Cuma'nın bereketini Kaza namazların için kullan.",
      "Bu Cuma senin için şahit olsun.",
      "Bugünü kazasız geçirme."
    ],
    milestones: {
      title: "Tebrikler! Hedefe yaklaştın 🎉",
      25: "Tebrikler! 25% tamamlandı! 🥉",
      50: "Yolun yarısı bitti! MaşaAllah! 🥈",
      75: "Son düzlük! 75% tamamlandı! 🥇",
      100: "Allahu Ekber! Borcun bitti! 🏆",
      fallback: (p: number) => `Hedefinin %${p}'sine ulaştın!`
    }
  }
};

webpush.setVapidDetails(adminEmail, vapidPublicKey, vapidPrivateKey)
const supabase = createClient(supabaseUrl, supabaseKey)

function getLang(profile: any): 'de' | 'en' | 'tr' {
  const lang = profile?.preferred_language || 'de';
  return (['de', 'en', 'tr'].includes(lang)) ? lang : 'de';
}

Deno.serve(async (req) => {
  try {

    // Prüfen ob Body leer ist
    if (!req.body) {
        return new Response("No body", { status: 400 });
    }

    const body = await req.json();
    const { record, type } = body; // type: 'WEEKLY_MOTIVATION' | 'MILESTONE', record nur bei MILESTONE zB. { user_id, amount }
    let notifications = []; // { userId, title, body }

    // CRONJOB
    if (type === 'WEEKLY_MOTIVATION') {
      console.log("Typ: Weekly Motivation");
      const today = new Date();
      const day = today.getDay(); // 0=Sonntag, 1=Montag, ... 5=Freitag
      
      // Alle Abos holen
      const { data: subs } = await supabase.from('push_subscriptions').select('user_id');
      
      if (subs && subs.length > 0) {
        const uniqueUserIds = [...new Set(subs.map(s => s.user_id))];

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, preferred_language')
          .in('id', uniqueUserIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Nachrichten generieren
        for (const uid of uniqueUserIds) {
          const lang = getLang(profileMap.get(uid));
          const texts = I18N[lang];
          
          let quote = "";
          let title = "";

          if (day === 1) { // Montag
             title = texts.monday_title;
             quote = texts.monday_quotes[Math.floor(Math.random() * texts.monday_quotes.length)];
          } else if (day === 5) { // Freitag
             title = texts.friday_title;
             quote = texts.friday_quotes[Math.floor(Math.random() * texts.friday_quotes.length)];
          }

          if (quote) {
            notifications.push({ userId: uid, title, body: quote });
          }
        }
      }
    }

    // MEILENSTEINE (WEBHOOK)
    else if (record && record.amount < 0) {
      const userId = record.user_id;
      const justCompleted = Math.abs(record.amount);

      // parallel Stats berechnen UND Profil laden (für Sprache)
      const [statsResult, profileResult] = await Promise.all([
         supabase.rpc('get_user_total_stats', { uid: userId }),
         supabase.from('profiles').select('preferred_language').eq('id', userId).single()
      ]);

      const stats = statsResult.data;
      const lang = getLang(profileResult.data);
      const texts = I18N[lang];

      if (stats && stats[0]) {
        const totalDone = Number(stats[0].total_done);
        const totalOpen = Number(stats[0].total_open);
        const totalGoal = totalDone + totalOpen;

        if (totalGoal > 0) {
          const currentPercent = (totalDone / totalGoal) * 100;
          const prevPercent = ((totalDone - justCompleted) / totalGoal) * 100;

          const thresholds = [25, 50, 75, 100];
          
          for (const t of thresholds) {
            if (prevPercent < t && currentPercent >= t) {
              const bodyText = texts.milestones[t as keyof typeof texts.milestones] || texts.milestones.fallback(t);
              
              notifications.push({
                userId: userId,
                title: texts.milestones.title,
                body: bodyText
              });
              break; 
            }
          }
        }
      }
    }

    if (notifications.length === 0) {
      return new Response(JSON.stringify({ message: "Nichts zu senden" }), { headers: { "Content-Type": "application/json" } });
    }

    const results = [];
    
    for (const notif of notifications) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', notif.userId);

      if (subs) {
        for (const sub of subs) {
          try {
            // WICHTIG: 'notification' Objekt muss bleiben, sonst wird Push nicht angezeigt
            const payload = JSON.stringify({
              notification: {
                title: notif.title,
                body: notif.body,
                icon: `${APP_URL}/assets/icons/icon-192x192.png`,
                badge: `${APP_URL}/assets/icons/icon-72x72.png`,
                vibrate: [100, 50, 100],
                data: {
                  url: `${APP_URL}/#/dashboard`,
                  dateOfArrival: Date.now()
                }
              }
            });

            await webpush.sendNotification(sub.subscription, payload);
            results.push({ user: notif.userId, status: 'sent' });

          } catch (err) {
             console.error(`Push-Fehler User ${notif.userId}`, err);
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