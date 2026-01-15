# 🎨 Pastel Paint - Coloring Book App

A beautiful web-based coloring book application with fill tool, undo/redo, and more!

## 🚀 Quick Start

### For Windows Users (Easiest!)

1. **Double-click `LAUNCH-PASTEL-PAINT.bat`**
   - That's it! The server will start and your browser will open automatically.

2. **Keep the minimized server window open** while using the app.

3. **When done**, close the "Pastel Paint Server" window.

### Manual Start (Alternative)

If the launcher doesn't work:

1. Open PowerShell in this folder
2. Run: `python -m http.server 8000`
3. Open your browser and go to: `http://localhost:8000/index.html`

## 📋 Requirements

- Python 3.x (usually pre-installed on Windows 10/11)
- A modern web browser (Chrome, Edge, Firefox, etc.)

## 🎮 How to Use

1. **Choose a Picture**: Click "🎨 Choose Picture" to select a coloring page
2. **Select Colors**: Click any color from the palette
3. **Use Tools**:
   - 🖌️ **Brush**: Draw freely
   - ⬜ **Eraser**: Erase mistakes
   - 🪣 **Fill Tool**: Click to fill areas with color
4. **Undo/Redo**: Use the undo/redo buttons or Ctrl+Z / Ctrl+Y
5. **Save**: Click "Save Drawing" to download your artwork

## ❓ Troubleshooting

**"Cannot use fill tool" error?**
- Make sure you're accessing via `http://localhost:8000/index.html`
- NOT by opening the HTML file directly (`file:///...`)
- The server must be running!

**Server won't start?**
- Make sure Python is installed: `python --version`
- Check if port 8000 is already in use
- Try a different port: `python -m http.server 8080`

## 📁 Files

- `index.html` - Main app file
- `script.js` - Application logic
- `style.css` - Styling
- `images/` - Coloring book images folder
- `LAUNCH-PASTEL-PAINT.bat` - Easy launcher (double-click to start!)

## 💡 Tips

- Use the fill tool on white/light areas for best results
- Undo/Redo works for all actions
- Save your artwork frequently!
- The canvas size is 800x800 pixels

Enjoy coloring! 🎨✨
