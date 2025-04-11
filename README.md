# Animated Cursor - Obsdian Plugin

Give your cursor a simple, yet smooth, move animation. Inspired by Microsoft Office and VSCode smooth cursor.

![animated-cursor.gif](./docs/assests/animated-cursor.gif)

## 🚀 Features

- Move and blink animation for the cursor.
- Work on both table and canvas.
- Support multi-cursor.
- Adjustable cursor speed and blink duration (via [Style Settings][style-settings] plugin).

## 📦 Installation

- Manual
    - Create a folder named `animated-cursor` under `YOUR_VAULT_NAME/.obsidian/plugins`.
    - Place `manifest.json`, `main.js`, and `style.css` from the latest release into the folder.
    - Enable it through the "Community plugin" setting tab.
- Using [BRAT][].

> [!Note]
>
> Currently, this plugin haven't been released yet.

## ✍️ Usage

Simply move the cursor by pressing arrow keys, clicking or dragging using your mouse. The cursor will stop blinking while it's moving.

## ⚙️ Adjustment

Via [Style Settings][style-settings] plugin you can:
- adjust the cursor speed in miliseconds,
- adjust the blink rate in miliseconds,
- set the blink count in a sequence,
- toggle infinity blinking.

Additionally, in the "Animated Cursor" plugin settings, you have an option to make the cursor move slightly more smoothly:
- If turned on, move transition uses `transform` property, but the cursor seems to appear blurry.
- If turned off, it uses `top` and `left` properties.

> [!Note]
>
> You can disable the blink by adjust the blink count to zero.

## ⚠️ Caveat

Because this plugin uses DOM to draw the cursor, it could -_probably_- **cost expensive performance** due to frequently layout recomputation, especially when you repeatedly move the cursor.

## 🐞 Known Bugs

- Flicker/jitter effect occurs when the cursor is continously moved by holding the arrow keys.
- Weird behavior when move the cursor outside the table.

Feel free to let me know if you find any bugs...

## 🙏 Acknowledgment

Thanks to:
- [VSCode](https://github.com/microsoft/vscode) for the smooth cursor concept.
- [CodeMirror](https://github.com/codemirror), [Marijnh](https://github.com/marijnh), and its community.

[style-settings]: https://github.com/mgmeyers/obsidian-style-settings
[BRAT]: https://github.com/TfTHacker/obsidian42-brat
