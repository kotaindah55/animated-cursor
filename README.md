# Animated Cursor - Obsdian Plugin

![latest-version] ![current-downloads] ![current-stars] ![open-issues]

Give your cursor a simple, yet smooth, move animation. Inspired by Microsoft Office and VSCode smooth cursor.

![animated-cursor.gif](./docs/assests/animated-cursor.gif)

> [!WARNING]
> 
> Read **caveat** section below before installing this plugin!

## 🚀 Features

- Move and blink animation for the cursor.
- Work on both hovering page preview and canvas.
- Support multi-cursor.
- Adjustable cursor speed and blink duration (via [Style Settings][style-settings] plugin).

## 🎨 What makes it different?

- **Works as native cursor**. This plugin patch existing Obsidian cursor, avoiding any unintended calculations.
  The same plugin before creates another cursor instance, yet still let Obsidian calculate its own cursor.
- **Hardly relies on [CodeMirror][] API**. It's the secret of the consistency of the cursor behavior. Thus, it
  doesn't face any meaningful problems with multi-cursor, canvas, etc.

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

- Buggy multi-cursors on the table.
- ~~Flicker/jitter effect occurs when the cursor is continously moved by holding the arrow keys.~~
- ~~Weird behavior when move the cursor outside the table.~~

Feel free to let me know if you find any bugs...

## ©️ Attribution

This plugin includes some of the source codes developed by [Marijnh Haverbeke][marijnh] and the others at [CodeMirror][], with some modifications. All their works are licensed under MIT.

## 🙏 Acknowledgment

Thanks to:
- [VSCode](https://github.com/microsoft/vscode) for the smooth cursor concept.
- [CodeMirror][], [Marijnh][], and its community.

[CodeMirror]: https://codemirror.net
[Marijnh]: https://github.com/marijnh
[style-settings]: https://github.com/mgmeyers/obsidian-style-settings
[BRAT]: https://github.com/TfTHacker/obsidian42-brat

[latest-version]: https://img.shields.io/github/manifest-json/v/kotaindah55/animated-cursor?label=version&link=https%3A%2F%2Fgithub.com%2Fkotaindah55%2Fanimated-cursor%2Freleases
[current-downloads]: https://img.shields.io/github/downloads/kotaindah55/animated-cursor/total?link=https%3A%2F%2Fgithub.com%2Fkotaindah55%2Fanimated-cursor
[current-stars]: https://img.shields.io/github/stars/kotaindah55/animated-cursor?style=flat&link=https%3A%2F%2Fgithub.com%2Fkotaindah55%2Fanimated-cursor%2Fstargazers
[open-issues]: https://img.shields.io/github/issues-search?query=repo%3Akotaindah55%2Fanimated-cursor%20is%3Aopen&label=open%20issues&color=red&link=https%3A%2F%2Fgithub.com%2Fkotaindah55%2Fanimated-cursor%2Fissues
