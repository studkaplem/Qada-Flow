# Qada' Flow

Qada' Flow is an open-source web application designed to help Muslims calculate, track, and fulfill their missed prayers (Qada'). 

Unlike simple tally counters, this application focuses on sustainable habit formation. It combines the Islamic concept of **Istiqamah** (steadfastness) with modern behavioral psychology principles (such as Habit Stacking) to create manageable, long-term repayment plans.

## Project Overview

The core problem this application solves is the overwhelming nature of calculating years of missed prayers. Qada' Flow breaks this debt down into daily, actionable targets and visualizes progress to maintain motivation over months or years.

### Key Features

**1. Adaptive Calculator**
*   **Timeframe Logic:** Calculates total debt based on specific start and end dates.
*   **Biological Adjustments:** Automatically accounts for menstrual cycles for female users to deduct non-obligatory days from the total calculation.
*   **Capacity Planning:** Generates a daily target based on the user's chosen intensity (e.g., "Sprint" vs. "Steady").

**2. Habit Stacking System**
*   Based on James Clear's "Atomic Habits" methodology.
*   Allows users to define "If/Then" rules (e.g., *"After [Dhuhr Fard], I will pray [1 Set of Qada]"*).
*   Reduces decision fatigue by anchoring new habits to existing daily obligations.

**3. Quality (Khushu) Tracking**
*   Logs the quality of prayer alongside the quantity.
*   Users rate their focus level (Distracted, Present, Deep/Ihsan).
*   Visualizes focus patterns via Radar charts to identify times of day with lower spiritual presence.

**4. Data Visualization & Gamification**
*   **The Garden:** A procedural visualization where completed prayer sets generate plants, providing positive reinforcement.
*   **Analytics:** D3.js-powered charts including Heatmaps (consistency streaks), Trend Lines (velocity), and Radial Charts (prayer type breakdown).
*   **Forecasting:** Real-time calculation of the estimated completion date based on current velocity.

**5. Privacy First**
*   All data is currently persisted in the browser's `LocalStorage`.
*   No personal data is sent to external servers.
*   Offline-capable logic.

## Technical Stack

This project serves as a reference implementation for modern Angular development practices (v18+).

*   **Framework:** Angular (Standalone Components)
*   **State Management:** Angular Signals (No NgRx/Redux boilerplate)
*   **Change Detection:** Zoneless (`provideZonelessChangeDetection`)
*   **Styling:** Tailwind CSS
*   **Visualization:** D3.js
*   **Icons:** FontAwesome
*   **Localization:** Custom i18n implementation (Support for EN, DE, TR)

## Architecture

The application follows a modular monolith structure with a clear separation of concerns:

*   `src/components`: UI components (Presentation layer).
*   `src/services`: Business logic and State (Data layer).
*   `src/guards`: Route protection logic.
*   `src/i18n`: Translation dictionaries.

## Getting Started

### Prerequisites
*   Node.js (LTS version recommended)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/qada-flow.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd qada-flow
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Start the development server:
    ```bash
    npm start
    ```
5.  Open your browser at `http://localhost:4200`.

## Contributing

Contributions are welcome. Please ensure that you follow the existing code style (Signals over RxJS where possible for state, Tailwind for styling).

1.  Fork the repository.
2.  Create a feature branch.
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

## License

This project is open-source and available under the MIT License.
