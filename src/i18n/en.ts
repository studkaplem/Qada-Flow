
export const en = {
  nav: {
    dashboard: "Dashboard",
    tracker: "Today's Prayers",
    calculator: "Calculator",
    inspire: "Inspire & Learn",
    profile: "My Account",
    guide: "User Guide",
    version: "Ver. 1.0.0"
  },
  landing: {
    hero_title: "Turn your spiritual debt into a garden of growth.",
    hero_subtitle: "The intelligent Qada' tracker for Muslims. No guilt. No spreadsheets. Just consistent progress towards Allah.",
    cta_start: "Start Your Journey",
    cta_login: "Login",
    feature_1_title: "Smart Calculation",
    feature_1_desc: "Calculate missed prayers accurately, accounting for biological cycles and life events.",
    feature_2_title: "Habit Stacking",
    feature_2_desc: "Integrate Qada' seamlessly into your daily Fard prayers without decision fatigue.",
    feature_3_title: "Visual Growth",
    feature_3_desc: "See your progress bloom. Every prayer performed plants a seed in your virtual garden.",
    opensource_title: "100% Free & Open Source",
    opensource_desc: "Qada' Flow is a Sadaqah Jariyah project. We do not sell your data. We do not show ads.",
    opensource_sub: "Built by the community, supported by voluntary donations.",
    privacy_badge: "Privacy First: Data stored locally"
  },
  guide: {
    title: "How to use Qada' Flow",
    subtitle: "Understanding the core concepts to maximize your spiritual success.",
    concepts: {
      c1_title: "What is a 'Set'?",
      c1_desc: "A 'Set' equals one full day of missed prayers (Fajr, Dhuhr, Asr, Maghrib, Isha, Witr). If you missed 1 year of prayers, you have 365 Sets to make up. We track in Sets to keep things simple.",
      c2_title: "The Habit Stacker",
      c2_desc: "This is not a to-do list item. It is a permanent rule for your life. By saying 'After Dhuhr, I pray Qada', you remove the decision fatigue. It applies every single day until you change it.",
      c3_title: "Quality over Quantity",
      c3_desc: "It is better to pray 1 Set with focus (Khushu) than 5 Sets quickly and poorly. Allah looks at your heart. Use the quality rater in the Tracker to monitor your presence.",
      c4_title: "The Garden",
      c4_desc: "The garden on your dashboard grows automatically. Every 10 full Sets you complete plants a new tree. This symbolizes your preparation for the Hereafter (Jannah)."
    },
    features: {
      title: "Features Deep Dive",
      tracker_title: "Tracking & Khushu",
      tracker_desc: "Use the 'Tracker' page to log prayers. When clicking (+), you will see 3 faces. This represents your Focus (Khushu). Be honest—this helps you analyze your spiritual presence.",
      charts_title: "Reading the Charts",
      chart_bar: "Bar: Simple 'Done' vs 'Remaining' per prayer type.",
      chart_radar: "Quality (Radar): Shows balance. A dent at 'Fajr' means you lack focus in the morning.",
      chart_trend: "Trend: Shows your consistency over the last 14 days.",
      adjust_title: "Planning & Adjustments",
      adjust_date: "Target Date: Click the gear icon on the dashboard to set a deadline (e.g. 'Finish by Ramadan'). The app calculates daily sets needed.",
      adjust_manual: "Manual Edit: Click the pencil icon near 'Total Missed' to fix numbers manually (e.g., calculation errors)."
    },
    faq: {
      title: "Frequently Asked Questions",
      q1: "Do I have to calculate perfectly?",
      a1: "No. Islam is easy. Make a sincere estimate (Ghalib al-Zann). If you are unsure, estimate slightly higher to be safe, then trust in Allah's mercy.",
      q2: "What if I miss a day of Qada?",
      a2: "Don't give up. The 'Sprint' and 'Steady' modes in the dashboard will adjust your estimated completion date automatically. Just continue the next day."
    },
    cta: "Go to Calculator"
  },
  dashboard: {
    welcome: "Assalamu Alaikum",
    subtitle: "Here is your spiritual progress overview.",
    next_prayer: "Next Prayer",
    total_missed: "Total Missed",
    prayers_made_up: "Prayers Made Up",
    done: "Done",
    debt_cleared: "of total debt cleared",
    est_completion: "Est. Completion",
    sprint_mode: "Sprint Mode",
    steady_mode: "Steady Mode",
    sets_day: "sets/day",
    todays_times: "Today's Times",
    garden_title: "Garden of Jannah",
    garden_subtitle: "1 Plant = 10 Prayers",
    garden_hint: "Growing based on your consistency",
    garden_empty: "Plant your first seed today.",
    habit_stacker: {
      title: "Routine Designer",
      subtitle: "Link Qada to your existing compulsory prayers.",
      formula_pre: "After my",
      formula_mid: "prayer, I will pray",
      formula_post: "of Qada.",
      placeholder_trigger: "Choose Trigger",
      placeholder_action: "Choose Action",
      save: "Set Routine",
      my_identity: "My Commitment",
      triggers: {
        fard_fajr: "Fajr (Fard)",
        fard_dhuhr: "Dhuhr (Fard)",
        fard_asr: "Asr (Fard)",
        fard_maghrib: "Maghrib (Fard)",
        fard_isha: "Isha (Fard)",
        wudu: "Wudu",
        sleep: "Sleep"
      },
      actions: {
        set_1: "1 Set",
        set_2: "2 Sets",
        only_fard: "just the Fard (Qada)"
      }
    },
    charts: {
      title: "Prayer Debt vs. Progress",
      bar: "Overview",
      radial: "Detail",
      quality: "Quality",
      trend: "Trend",
      habit: "Habit",
      done_legend: "Done",
      remaining_legend: "Remaining",
      no_data: "No data available yet.",
      go_calc: "Go to Calculator"
    },
    modals: {
      plan_title: "Adjust Your Routine",
      plan_subtitle: "Challenge yourself or slow down.",
      calc_title: "Challenge Calculator",
      calc_desc: "Challenge Calculator",
      daily_target: "Daily Qada' Target",
      cancel: "Cancel",
      update: "Update Plan",
      edit_title: "Edit Prayer Counts",
      edit_subtitle: "Manually adjust outstanding debts.",
      edit_hint: "Use (+) to increase debt if you missed more, or (-) to decrease if you calculated too many.",
      done: "Done",
      search_title: "Select Location",
      search_subtitle: "Search for your city",
      search_placeholder: "Enter city (e.g. Istanbul, Berlin)",
      search_btn: "Search",
      searching: "Searching...",
      no_results: "No results found."
    }
  },
  calculator: {
    title: "Qada' Calculator",
    subtitle: "Let's estimate your missed prayers to build a realistic plan.",
    step1: "Timeframe",
    step1_desc: "When did the missed period start and end?",
    start_date: "Start Date",
    end_date: "End Date",
    duration: "Duration: Approx",
    years: "years",
    step2: "Adjustments",
    step2_desc: "Refine the calculation based on your situation.",
    is_female: "I am female (account for cycles)",
    cycle_days: "Average Cycle Duration (Days)",
    cycle_hint: "Days per month where prayers were not obligatory.",
    daily_capacity: "Daily Capacity",
    capacity_hint: "How many extra sets of Qada prayers can you perform daily?",
    cap_1: "1 Set (Slow & Steady)",
    cap_2: "2 Sets (Moderate)",
    cap_3: "3 Sets (Intense)",
    cap_5: "5 Sets (Full Day Makeup)",
    step3: "Ready to Plan?",
    step3_desc: "Based on your inputs, we will generate a personalized tracking plan. Remember, consistency is key in Islam.",
    generate_btn: "Generate Plan",
    back_btn: "Back",
    next_btn: "Next"
  },
  tracker: {
    title: "Daily Tracker",
    subtitle: "Focus on today's obligations and chip away at your debt.",
    target: "Target",
    left: "Left",
    todays_fard: "Today's Fard",
    makeup_qada: "Make up (Qada)",
    log_qada: "Log 1 Qada",
    focus_question: "How was your focus?",
    levels: {
      hard: "Distracted",
      good: "Present",
      deep: "Deep / Ihsan"
    }
  },
  profile: {
    welcome_back: "Welcome Back",
    sign_in_text: "Sign in to save your spiritual progress.",
    login: "Log In",
    signup: "Sign Up",
    full_name: "Full Name",
    email: "Email Address",
    password: "Password",
    create_account: "Create Account",
    logging_in: "Logging in...",
    creating: "Creating Account...",
    logout: "Log Out",
    member_since: "Member Since",
    current_plan: "Current Plan",
    progress: "Progress",
    sync_active: "Cloud Sync Active",
    sync_desc: "Your progress is automatically saved to your profile."
  },
  inspire: {
    title: "Knowledge & Motivation",
    subtitle: "Combine the wisdom of the Sunnah with modern habit psychology.",
    filter_all: "All",
    filter_islamic: "Quran & Sunnah",
    filter_science: "Habit Science",
    filter_practical: "Practical Tips",
    read_time: "read",
    read_article: "Read Article",
    close: "Close",
    action_step: "Action Step",
    footer_quote: "Knowledge without action is like a tree without fruit. Pick one tip and apply it today.",
    quote: {
      text: "The most beloved of deeds to Allah are those that are most consistent, even if they are small.",
      source: "Prophet Muhammad (ﷺ), Sahih Bukhari"
    },
    articles: {
      a1: {
        title: "The Science of Habit Formation",
        excerpt: "Why small, consistent actions (Istiqamah) rewire your brain more effectively.",
        content: [
          "Neuroplasticity research shows that repeating a behavior in a specific context strengthens the neural pathways associated with that action. This is the biological basis of 'Istiqamah'.",
          "When you perform Qada prayers immediately after a Fard prayer, you leverage an existing neural trigger. This reduces the 'activation energy' required to start the task.",
          "James Clear, author of Atomic Habits, calls this 'Habit Stacking'. In Islam, we are taught that the most beloved deeds to Allah are those that are consistent, even if small."
        ],
        action: "Link one Qada prayer to your Dhuhr prayer for the next 7 days.",
        source: "Atomic Habits / Sunnah"
      },
      a2: {
        title: "Overcoming Decision Fatigue",
        excerpt: "Stop asking yourself 'Should I pray Qada now?'. Make it a rule.",
        content: [
          "Decision fatigue refers to the deteriorating quality of decisions made by an individual after a long session of decision making.",
          "If you have to decide *when* to pray your Qada every single day, you will eventually choose not to do it because your willpower is drained.",
          "The solution is to automate the decision. Create a rule: 'I always pray Qada before breakfast' or 'I always pray Qada after Maghrib'."
        ],
        action: "Set a fixed time for your Qada and stick to it for 3 days.",
        source: "Psychology of Willpower"
      },
      a3: {
        title: "Hope over Despair (Rawj & Khawf)",
        excerpt: "Your debt is large, but Allah’s mercy is larger.",
        content: [
          "Shaytan wants you to look at the mountain of missed prayers and despair. He wants you to think 'It is impossible, I will never finish'.",
          "This is a trap. Allah does not ask you to finish everything today. He asks you to try today.",
          "Focus on the step you are taking now, not the entire journey ahead."
        ],
        action: "Make a sincere Dua asking Allah to help you remain consistent.",
        source: "Theology of Repentance"
      },
      a4: {
        title: "The 'Sprint' vs. 'Marathon' Mindset",
        excerpt: "Why burning out in the first week causes failure.",
        content: [
          "Many people start their Qada journey by praying 50 sets in one day. After 3 days, they are exhausted and stop completely.",
          "This is the sprint mindset, and it fails in spiritual marathons. The Prophet (pbuh) advised moderation.",
          "Calculated consistency beats sporadic intensity every time."
        ],
        action: "Reduce your daily target to a number you can definitely hit even on your worst day.",
        source: "Productivity Tips"
      },
      a5: {
        title: "The Dopamine of Progress",
        excerpt: "Using visual trackers to hack your brain's reward system.",
        content: [
          "The brain releases dopamine when it anticipates a reward or sees progress. This is why ticking a box on a checklist feels good.",
          "Qada Flow uses the 'Garden' visualization to give you that visual feedback.",
          "Do not underestimate the power of simply tracking your numbers. What gets measured, gets managed."
        ],
        action: "Check your progress graph after logging your prayers today.",
        source: "Behavioral Psychology"
      },
      a6: {
        title: "Qada as a form of Tawbah",
        excerpt: "Repaying your debt is not a punishment, it is a purification.",
        content: [
          "Do not view your Qada prayers as a burden or a punishment for past sins. View them as a ladder.",
          "Every Sujood you perform in Qada is washing away the negligence of the past. It is an active form of Tawbah (Repentance).",
          "Turn your regret into action. Action wipes out the error."
        ],
        action: "Perform Wudu with the intention of washing away sins.",
        source: "Spiritual Purification"
      }
    }
  },
  admin: {
    title: "Admin Console",
    subtitle: "System monitoring and content management.",
    tabs: {
      analytics: "Analytics",
      cms: "CMS"
    },
    kpi: {
      users: "Total Users",
      active: "Daily Active",
      db: "DB Usage",
      cost: "Est. Cost"
    },
    chart_title: "Metric History",
    cms: {
      create_title: "Create New Article",
      edit_title: "Edit Article",
      list_title: "Published Articles",
      form: {
        title: "Title",
        category: "Category",
        read_time: "Read Time",
        excerpt: "Excerpt",
        content: "Content (Paragraphs)",
        action: "Action Step",
        icon: "Icon (FontAwesome)",
        source: "Source"
      },
      btn: {
        cancel: "Cancel",
        create: "Publish Article",
        update: "Update Article",
        custom: "Custom",
        system: "System"
      }
    }
  },
  common: {
    fajr: "Fajr",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
    witr: "Witr"
  }
};
