from PIL import Image, ImageDraw, ImageFont

output_path = r"C:\Users\Dell\.gemini\antigravity-ide\brain\fbe73f37-b4d0-4a2b-94c4-05daf01be127\api_streak_widgets_showcase.png"
icon_path = r"d:\AndroidStudio\TestProject\EffectiveStreak\public\app-icon.png"

# Canvas setup
width, height = 1200, 720
canvas = Image.new("RGBA", (width, height), (7, 10, 18, 255))
draw = ImageDraw.Draw(canvas)
icon_img = Image.open(icon_path).convert("RGBA")

try:
    font_title = ImageFont.truetype("segoeui.ttf", 22)
    font_subtitle = ImageFont.truetype("segoeui.ttf", 13)
    font_card_title = ImageFont.truetype("segoeuib.ttf", 16)
    font_bold = ImageFont.truetype("segoeuib.ttf", 13)
    font_regular = ImageFont.truetype("segoeui.ttf", 11)
    font_streak = ImageFont.truetype("segoeuib.ttf", 22)
    font_pill_title = ImageFont.truetype("segoeuib.ttf", 11)
    font_pill_streak = ImageFont.truetype("segoeuib.ttf", 14)
    font_pill_status = ImageFont.truetype("segoeuib.ttf", 9)
except:
    font_title = ImageFont.load_default()
    font_subtitle = font_title
    font_card_title = font_title
    font_bold = font_title
    font_regular = font_title
    font_streak = font_title
    font_pill_title = font_title
    font_pill_streak = font_title
    font_pill_status = font_title

# Header
draw.text((40, 25), "EffStreak • Cross-Platform API Streak Widgets", fill=(255, 255, 255), font=font_title)
draw.text((40, 58), "1. Ultra-Attractive Cyber-Glass Design   2. Strictly API Streaks (No Offline Plans)   3. Double-Tap/Click to Open App", fill=(148, 163, 184), font=font_subtitle)

# --- 1. LEFT CARD: Android Mobile Widget ---
left_x, left_y, left_w, left_h = 40, 95, 540, 580
draw.rounded_rectangle([left_x, left_y, left_x + left_w, left_y + left_h], radius=20, fill=(12, 16, 28, 255), outline=(139, 92, 246, 120), width=1)
draw.text((left_x + 24, left_y + 18), "Android Mobile Widget (Jetpack Glance)", fill=(167, 139, 250), font=font_card_title)
draw.text((left_x + 24, left_y + 42), "Live on Phone Home Screen • Double-Tap/Tap opens MainActivity", fill=(100, 116, 139), font=font_regular)

# Android Medium (4x2) Widget Mockup
m_x, m_y, m_w, m_h = left_x + 24, left_y + 70, 490, 215
draw.rounded_rectangle([m_x, m_y, m_x + m_w, m_y + m_h], radius=18, fill=(0, 0, 0, 255), outline=(168, 85, 247, 200), width=2)

# Widget Header
icon_small = icon_img.resize((28, 28), Image.Resampling.LANCZOS)
canvas.paste(icon_small, (m_x + 16, m_y + 14), icon_small)
draw.text((m_x + 52, m_y + 12), "97d Active Streak", fill=(251, 146, 60), font=font_streak)
draw.text((m_x + 52, m_y + 40), "Lv.18 Knight • API LIVE TRACKER", fill=(192, 132, 252), font=font_regular)

draw.text((m_x + m_w - 145, m_y + 14), "100% API SYNCED", fill=(52, 211, 153), font=font_bold)
draw.text((m_x + m_w - 145, m_y + 36), "Double-tap to open ->", fill=(56, 189, 248), font=font_regular)

# 4 API Platform Streaks
api_items = [
    ("LeetCode", "42 Days", "ACTIVE", (16, 185, 129)),
    ("Codeforces", "18 Days", "ACTIVE", (16, 185, 129)),
    ("GFG", "31 Days", "ACTIVE", (16, 185, 129)),
    ("GitHub", "26 Days", "ACTIVE", (16, 185, 129)),
]

for i, (name, streak, status, col) in enumerate(api_items):
    px = m_x + 16 + (i * 116)
    py = m_y + 75
    draw.rounded_rectangle([px, py, px + 108, py + 105], radius=12, fill=(6, 28, 20, 220), outline=(52, 211, 153, 140), width=1)
    draw.text((px + 12, py + 10), name, fill=(226, 232, 240), font=font_pill_title)
    draw.text((px + 12, py + 38), streak, fill=(251, 146, 60), font=font_pill_streak)
    draw.text((px + 12, py + 72), status, fill=col, font=font_pill_status)

draw.text((m_x + 16, m_y + m_h - 22), "Strictly API Streaks Only • No Offline Tasks", fill=(148, 163, 184), font=font_regular)

# Android Compact (2x2) Widget Mockup
c_x, c_y, c_w, c_h = left_x + 24, left_y + 305, 235, 235
draw.rounded_rectangle([c_x, c_y, c_x + c_w, c_y + c_h], radius=18, fill=(0, 0, 0, 255), outline=(139, 92, 246, 180), width=2)
canvas.paste(icon_small, (c_x + 16, c_y + 14), icon_small)
draw.text((c_x + 50, c_y + 18), "EffStreak", fill=(255, 255, 255), font=font_bold)
draw.text((c_x + c_w - 75, c_y + 18), "API LIVE", fill=(52, 211, 153), font=font_regular)

draw.text((c_x + 36, c_y + 58), "97d Streak", fill=(251, 146, 60), font=font_streak)
draw.text((c_x + 36, c_y + 90), "OVERALL STREAK", fill=(148, 163, 184), font=font_regular)

draw.rounded_rectangle([c_x + 14, c_y + 118, c_x + c_w - 14, c_y + 185], radius=10, fill=(18, 24, 38, 200))
draw.text((c_x + 22, c_y + 128), "LeetCode: 42d", fill=(226, 232, 240), font=font_bold)
draw.text((c_x + 22, c_y + 152), "Codeforces: 18d", fill=(226, 232, 240), font=font_bold)
draw.text((c_x + 20, c_y + 200), "Double-tap to open ->", fill=(56, 189, 248), font=font_regular)


# --- 2. RIGHT CARD: Windows Laptop Desktop Floating Widget ---
right_x, right_y, right_w, right_h = 610, 95, 550, 580
draw.rounded_rectangle([right_x, right_y, right_x + right_w, right_y + right_h], radius=20, fill=(12, 16, 28, 255), outline=(56, 189, 248, 120), width=1)
draw.text((right_x + 24, right_y + 18), "Windows Laptop Desktop Widget", fill=(56, 189, 248), font=font_card_title)
draw.text((right_x + 24, right_y + 42), "Floating Always-on-Top • Double-Click launches Desktop App Window", fill=(100, 116, 139), font=font_regular)

# Desktop Floating Widget Mockup
d_x, d_y, d_w, d_h = right_x + 24, right_y + 70, 500, 240
draw.rounded_rectangle([d_x, d_y, d_x + d_w, d_y + d_h], radius=18, fill=(0, 0, 0, 255), outline=(56, 189, 248, 220), width=2)

canvas.paste(icon_small, (d_x + 16, d_y + 14), icon_small)
draw.text((d_x + 52, d_y + 14), "EffStreak • API Tracker", fill=(255, 255, 255), font=font_bold)
draw.text((d_x + 52, d_y + 36), "Knight Lv.19 • All 6 Platforms Synced", fill=(192, 132, 252), font=font_regular)

draw.text((d_x + d_w - 145, d_y + 14), "97d (90%)", fill=(251, 146, 60), font=font_streak)

# 6 Connected Desktop Platforms
desktop_items = [
    ("LeetCode", "42 Days", "SYNCED"),
    ("Codeforces", "18 Days", "SYNCED"),
    ("GFG", "31 Days", "SYNCED"),
    ("GitHub", "26 Days", "SYNCED"),
    ("AtCoder", "14 Days", "IDLE"),
    ("YouTube", "12 Days", "IDLE"),
]

for i, (name, streak, status) in enumerate(desktop_items):
    col_idx = i % 3
    row_idx = i // 3
    px = d_x + 16 + (col_idx * 158)
    py = d_y + 70 + (row_idx * 66)
    is_active = "SYNCED" in status
    fill_col = (6, 28, 20, 220) if is_active else (20, 24, 36, 180)
    out_col = (52, 211, 153, 140) if is_active else (71, 85, 105, 100)
    
    draw.rounded_rectangle([px, py, px + 148, py + 56], radius=10, fill=fill_col, outline=out_col, width=1)
    draw.text((px + 10, py + 8), name, fill=(226, 232, 240), font=font_pill_title)
    draw.text((px + 10, py + 28), streak, fill=(251, 146, 60), font=font_pill_streak)
    draw.text((px + 85, py + 30), status, fill=(52, 211, 153) if is_active else (148, 163, 184), font=font_pill_status)

# Desktop Bottom Bar
draw.text((d_x + 16, d_y + d_h - 24), "Double-click anywhere on widget to bring EffStreak App to front", fill=(56, 189, 248), font=font_regular)

# Right Bottom Features Card
feat_x, feat_y, feat_w, feat_h = right_x + 24, right_y + 330, 500, 210
draw.rounded_rectangle([feat_x, feat_y, feat_x + feat_w, feat_y + feat_h], radius=16, fill=(18, 24, 38, 200), outline=(139, 92, 246, 100))
draw.text((feat_x + 20, feat_y + 16), "Widget Rules & Features Applied:", fill=(255, 255, 255), font=font_bold)

rules = [
    "1. Attractive Cyber-Glass Look: Deep AMOLED black with glowing violet/cyan borders.",
    "2. Strict API Streak Filter: Displays ONLY API streak platforms (LeetCode, CF, GFG, GitHub).",
    "3. No Offline Tasks: Excluded non-API general plans (Gym, Study, Internships, etc.).",
    "4. Double-Click to Open: Double-click/double-tap instantly launches the full application.",
]

for idx, r in enumerate(rules):
    draw.text((feat_x + 20, feat_y + 48 + (idx * 34)), r, fill=(203, 213, 225), font=font_regular)

canvas.save(output_path, "PNG")
print("Saved clean showcase:", output_path)
