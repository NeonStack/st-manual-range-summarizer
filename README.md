# 📝 ST Manual Range Summarizer

A very simple SillyTavern extension that condenses a range of chat messages into a single detailed narrative summary paragraph — great for keeping your context window clean during long roleplay sessions.

---

## ✨ Features

- Select a **from/to message range** to summarize
- AI generates a **detailed third-person narrative paragraph** enclosed in asterisks
- **Editable preview popup** — review and tweak the summary before applying
- Replaces the start message with the summary and **deletes the rest**
- **Customizable prompt** — rewrite the summary instructions however you like
- **`/condense` slash command** — use directly from the chat input
- Prompt is **saved locally** and persists between sessions

---

## 📦 Installation

### Via SillyTavern (Recommended)
1. In SillyTavern, click the **Extensions** icon (🧩)
2. Click **Install extension**
3. Paste this URL:
```
   https://github.com/NeonStack/st-manual-range-summarizer
```
4. Click **Save** — done!

### Manual (Termux / Linux)
```bash
cd ~/SillyTavern/public/scripts/extensions/third-party
git clone https://github.com/NeonStack/st-manual-range-summarizer.git chat-summarizer
```

Then reload SillyTavern.

---

## 🚀 How to Use

### Option A — Extension Panel
1. Open the **Extensions** sidebar (🧩)
2. Scroll down to **📝 Chat Range Summarizer**
3. Enter **From** and **To** message numbers
4. Click **Summarize**
5. Edit the summary in the popup if needed
6. Click **✓ Apply**

### Option B — Slash Command
Type directly in the chat input:
```
/condense 0 10
```
This summarizes messages 0 through 10, placing the summary at message 0 and deleting messages 1–10.

---

## 🔢 How Message Numbering Works

| You enter | Result |
|---|---|
| From `0` To `10` | Summary placed at msg `0`, msgs `1–10` deleted |
| From `15` To `20` | Summary placed at msg `15`, msgs `16–20` deleted |

> **Tip:** Message numbers start at 0. You can see them by hovering over messages in ST.

---

## ✏️ Customizing the Summary Prompt

In the extension panel, there is a **Summary Prompt** textarea where you can rewrite the instructions given to the AI.

Use `{{chat}}` as a placeholder — this is where the selected conversation will be inserted.

**Default prompt style:** detailed third-person past tense narrative enclosed in `*asterisks*`

You can change it to anything — bullet points, a different language, a different writing style, etc.

Click **💾 Save Prompt** to persist your changes, or **Reset Default** to go back to the original.

---

## 🛠️ Requirements

- [SillyTavern](https://github.com/SillyTavern/SillyTavern) (latest version recommended)
- Any configured AI backend (OpenAI, Claude, local models, etc.)

---

## 📋 Notes

- The extension uses whatever AI model you currently have active in SillyTavern
- Summaries are generated silently in the background without affecting your chat history
- The prompt and settings are saved in your browser's `localStorage`
- Works on desktop and mobile (including Termux + Android browser)

---

## 🤝 Contributing

Pull requests welcome! If you find a bug or want a feature, open an issue.

---

## 📄 License

MIT License — free to use, modify, and share.
