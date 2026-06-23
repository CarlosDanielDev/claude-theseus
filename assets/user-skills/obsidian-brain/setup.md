# Setup — Obsidian Brain

One-time configuration. After this, the skill works in every Claude Code session.

## 1. Enable the Local REST API in Obsidian

1. Open Obsidian → **Settings → Community plugins → Browse**.
2. Install **Local REST API** (by coddingtonbear) and enable it.
3. Open the plugin's settings. Copy the **API key**.
4. Confirm the **HTTPS URL** is enabled (the default is `https://127.0.0.1:27124/`). HTTP is fine to leave disabled — we use HTTPS.

## 2. Create the config file

```bash
mkdir -p ~/.config/obsidian-brain
cat > ~/.config/obsidian-brain/env <<'EOF'
export OBSIDIAN_API_KEY="PASTE_KEY_HERE"
export OBSIDIAN_BASE_URL="https://127.0.0.1:27124"
export OBSIDIAN_AI_FOLDER="_AI"
EOF
chmod 600 ~/.config/obsidian-brain/env
```

Edit the file and paste the real API key.

## 3. Verify

```bash
source ~/.config/obsidian-brain/env
curl -sk "$OBSIDIAN_BASE_URL/" | head
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/vault/" | head
```

The first call should return a server status JSON. The second should list the root of the vault.

## 4. Bootstrap the AI folder (once per vault)

```bash
source ~/.config/obsidian-brain/env
for sub in Logs Skills Projects Memory PRDs; do
  curl -sk -X PUT \
    -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
    -H "Content-Type: text/markdown" \
    --data "# ${sub}

This folder is part of the AI sandbox. Claude writes here; humans are free to read or reorganize.
" \
    "$OBSIDIAN_BASE_URL/vault/${OBSIDIAN_AI_FOLDER}/${sub}/README.md"
done
```

After this, `_AI/` exists in the vault with the five subfolders, each holding a README.

## 5. (Optional) Auto-start Obsidian at login

Because the REST API only works while Obsidian is running:

**System Settings → General → Login Items & Extensions → Add Obsidian.**

## Troubleshooting

| Symptom | Fix |
|---|---|
| `curl: (7) Failed to connect` | Obsidian isn't running, or Local REST API plugin is disabled. |
| `401 Unauthorized` | Wrong API key. Regenerate in plugin settings, update `env`. |
| `could not connect` but server up | You're hitting HTTP 27123 while only HTTPS 27124 is enabled. Use `https://127.0.0.1:27124`. |
| Self-signed cert error | Expected — always use `curl -k`. The skill's recipes already do. |
| Key showing up in git history | `~/.config/obsidian-brain/env` is outside any project — you're fine. Never commit this file. |
