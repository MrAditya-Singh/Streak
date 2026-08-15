from PIL import Image, ImageDraw, ImageFont
import os

bg_path = r"C:\Users\Dell\.gemini\antigravity-ide\brain\fbe73f37-b4d0-4a2b-94c4-05daf01be127\.user_uploaded\media_1786779940995.png"
app_path = r"C:\Users\Dell\.gemini\antigravity-ide\brain\fbe73f37-b4d0-4a2b-94c4-05daf01be127\desktop_app_full_1786779882430.png"
icon_path = r"d:\AndroidStudio\TestProject\EffectiveStreak\public\app-icon.png"
widget_path = r"C:\Users\Dell\.gemini\antigravity-ide\brain\fbe73f37-b4d0-4a2b-94c4-05daf01be127\desktop_widget_1786779903824.png"
output_path = r"C:\Users\Dell\.gemini\antigravity-ide\brain\fbe73f37-b4d0-4a2b-94c4-05daf01be127\user_home_screen_deployed.png"

bg = Image.open(bg_path).convert("RGBA")
app_img = Image.open(app_path).convert("RGBA")
icon_img = Image.open(icon_path).convert("RGBA")

# 1. Place Desktop Shortcut with Flame Crystal Icon at column 3 (x=142, y=365)
icon_resized = icon_img.resize((48, 48), Image.Resampling.LANCZOS)
bg.paste(icon_resized, (142, 365), icon_resized)

draw = ImageDraw.Draw(bg)
try:
    font = ImageFont.truetype("arial.ttf", 11)
    font_bold = ImageFont.truetype("arialbd.ttf", 12)
    font_title = ImageFont.truetype("arialbd.ttf", 13)
except:
    font = ImageFont.load_default()
    font_bold = font
    font_title = font

# Shortcut label
draw.text((144, 418), "EffStreak", fill=(0, 0, 0, 220), font=font)
draw.text((143, 417), "EffStreak", fill=(255, 255, 255, 255), font=font)

# 2. Render Open EffStreak Desktop App Window
win_w = int(bg.width * 0.70)
win_h = int(bg.height * 0.76)
win_x = int((bg.width - win_w) / 2) - 30
win_y = int((bg.height - win_h) / 2) - 20

# Drop shadow
shadow = Image.new("RGBA", (win_w + 30, win_h + 30), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(shadow)
sdraw.rounded_rectangle([10, 10, win_w + 20, win_h + 20], radius=16, fill=(0, 0, 0, 140))
bg.paste(shadow, (win_x - 15, win_y - 15), shadow)

# Window frame
window_surf = Image.new("RGBA", (win_w, win_h), (12, 16, 24, 255))
wdraw = ImageDraw.Draw(window_surf)
wdraw.rounded_rectangle([0, 0, win_w, win_h], radius=12, fill=(8, 12, 18, 255), outline=(139, 92, 246, 180), width=2)

# Titlebar
wdraw.rounded_rectangle([0, 0, win_w, 36], radius=12, fill=(18, 24, 38, 255))
wdraw.rectangle([0, 24, win_w, 36], fill=(18, 24, 38, 255)) # straighten bottom corners

# Title icon & text
app_icon_small = icon_img.resize((20, 20), Image.Resampling.LANCZOS)
window_surf.paste(app_icon_small, (12, 8), app_icon_small)
wdraw.text((38, 9), "EffStreak - Solo Leveling Habit & Streak System (Desktop App)", fill=(240, 245, 255), font=font_title)

# Window control buttons (red, yellow, green)
wdraw.ellipse([win_w - 24, 12, win_w - 12, 24], fill=(239, 68, 68))
wdraw.ellipse([win_w - 44, 12, win_w - 32, 24], fill=(234, 179, 8))
wdraw.ellipse([win_w - 64, 12, win_w - 52, 24], fill=(34, 197, 94))

# App content
content_w = win_w - 4
content_h = win_h - 38
app_crop = app_img.crop((0, 0, app_img.width, int(app_img.height * 0.70)))
app_resized = app_crop.resize((content_w, content_h), Image.Resampling.LANCZOS)
window_surf.paste(app_resized, (2, 36))

bg.paste(window_surf, (win_x, win_y), window_surf)

# 3. Render Floating Desktop Widget at bottom right
widget_w = 280
widget_h = 135
widget_x = bg.width - widget_w - 24
widget_y = bg.height - widget_h - 40

widget_surf = Image.new("RGBA", (widget_w, widget_h), (0, 0, 0, 0))
wid_draw = ImageDraw.Draw(widget_surf)
wid_draw.rounded_rectangle([0, 0, widget_w, widget_h], radius=16, fill=(10, 14, 22, 240), outline=(168, 85, 247, 220), width=2)

# Widget Header
widget_icon = icon_img.resize((20, 20), Image.Resampling.LANCZOS)
widget_surf.paste(widget_icon, (12, 10), widget_icon)
wid_draw.text((38, 11), "EffStreak Widget", fill=(255, 255, 255), font=font_bold)
wid_draw.text((widget_w - 86, 11), "🔥 97d  90%", fill=(251, 146, 60), font=font_bold)

# 4 Pills
pills = [("Leet", "✓"), ("CF", "✓"), ("GFG", "✓"), ("GH", "✓")]
for i, (name, status) in enumerate(pills):
    px = 12 + (i * 64)
    py = 38
    wid_draw.rounded_rectangle([px, py, px + 58, py + 52], radius=10, fill=(16, 44, 30, 200), outline=(52, 211, 153, 160), width=1)
    wid_draw.text((px + 14, py + 6), name, fill=(148, 163, 184), font=font)
    wid_draw.text((px + 22, py + 24), status, fill=(52, 211, 153), font=font_bold)

wid_draw.text((14, widget_h - 22), "Knight • 8/10 Completed", fill=(192, 132, 252), font=font)

bg.paste(widget_surf, (widget_x, widget_y), widget_surf)

bg.save(output_path, "PNG")
print("Saved to", output_path)
