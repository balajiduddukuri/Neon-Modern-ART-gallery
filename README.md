# Aether & Neon 🌌

**Aether & Neon** is an automated, generative art gallery that creates minimalistic, abstract paintings using Google's Gemini 2.5 Flash model. It fuses "Vibe Coding" principles with modern web technologies to deliver a serene, accessible, and infinite art experience.

## ✨ Features

### 🎨 Generative Art Engine
*   **Infinite Variety**: utilizing the Gemini API to generate unique minimalist abstract art based on curated themes (animals, nature, objects).
*   **Atmospheric Aesthetics**: Focuses on light gray-white backgrounds, loose brushstrokes, and neon accents.
*   **Auto-Curate Mode**: Automatically generates and transitions to new art pieces every 10 seconds.

### 🖼️ Viewing Experience
*   **Single Focus View**: A distraction-free, gallery-wall experience with sidebar history.
*   **Infinite Feed**: A vertical, responsive grid layout for continuous discovery.
*   **Zoom & Lightbox**: Click any artwork to view it in high-resolution full-screen mode.
*   **Favorites Gallery**: Save your best generations to a dedicated collection (persisted via LocalStorage).

### 🛠️ Tools & Integrations
*   **Push to Notion**: Seamlessly send art metadata (Subject, Prompt, Color Theme) to your personal Notion Database.
*   **Social Sharing**: Share art directly via native device sharing or copy to clipboard.
*   **Download**: Save the generated high-res images locally.

### ♿ Accessibility (Vibe Coding)
Designed with **WCAG 2.2 AA** compliance in mind:
*   **High Contrast Mode**: A dedicated toggle for distinct borders and maximum readability.
*   **Screen Reader Optimization**: Full usage of Semantic HTML (`<main>`, `<nav>`, `<article>`) and ARIA Live Regions for loading states.
*   **Sensory Feedback**: Integrated Audio cues and Haptic feedback (on supported devices) for tactile interaction.
*   **Keyboard Navigation**: Full focus management and "Skip to Content" links.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   A Google Cloud Project with the **Gemini API** enabled.

### Installation

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Setup**
    The application requires a Gemini API Key to function. Ensure `process.env.API_KEY` is available in your build environment.

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

---

## 📝 Configuration Guide

### Notion Integration Setup
To use the **"Push to Notion"** feature, you need to configure a Notion Integration.

1.  **Create an Integration**:
    *   Go to [Notion My Integrations](https://www.notion.so/my-integrations).
    *   Click **"New integration"**.
    *   Name it (e.g., "Aether Gallery") and submit.
    *   Copy the **"Internal Integration Secret"** (starts with `secret_...`).

2.  **Prepare your Database**:
    *   Create a new Database in Notion.
    *   Add the following properties (case-sensitive):
        *   `Subject` (Title)
        *   `Prompt` (Text)
        *   `Color Theme` (Select)
        *   `Feature` (Text)
        *   `Created At` (Date)
    *   *Note: Images cannot be uploaded via API to basic properties, so the prompt and metadata are stored instead.*

3.  **Connect Integration to Database**:
    *   Open your Database page in Notion.
    *   Click the **...** (three dots) in the top right corner.
    *   Select **"Connect to"** (or "Add connections") and choose your "Aether Gallery" integration.

4.  **Get Database ID**:
    *   Copy the link to your database view.
    *   The ID is the 32-character string between the `/` and the `?`.
    *   *Example*: `https://notion.so/myworkspace/a8aec43384f447ed84390e8e42c2e089?v=...` -> ID is `a8aec43384f447ed84390e8e42c2e089`.

5.  **Configure App**:
    *   In Aether & Neon, click the **Settings (Cog)** icon.
    *   Paste your **Secret Key** and **Database ID**.
    *   Click **Save Config**.

---

## 📂 Project Structure

*   **`App.tsx`**: Main application logic, state management (History, Favorites, View Modes), and layout routing.
*   **`components/`**:
    *   `GalleryWall.tsx`: The core visual component displaying art, frames, zoom logic, and lighting effects.
    *   `ControlPanel.tsx`: The UI floating bar for navigation, generation controls, and settings.
    *   `SettingsModal.tsx`: Configuration form for external integrations.
*   **`services/`**:
    *   `geminiService.ts`: Handles communication with Google's GenAI SDK.
    *   `promptService.ts`: Logic for combining subjects, textures, and colors into prompt strings.
    *   `notionService.ts`: Handles the API logic for sending data to Notion.
    *   `a11yService.ts`: Manages Web Audio API and Navigator Vibration API for sensory feedback.
*   **`types.ts`**: TypeScript interfaces and constant data collections (Subjects, Colors, Textures).

---

## 🤝 Contributing

This project is built for experimentation. Feel free to fork and add new `SUBJECTS` or `BACKGROUND_TEXTURES` in `types.ts` to expand the generative possibilities.

**Author**: Balaji Duddukuri
