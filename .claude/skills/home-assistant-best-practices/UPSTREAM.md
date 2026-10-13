# Herkomst

Deze skill is een kopie van `skills/home-assistant-best-practices` uit
https://github.com/homeassistant-ai/skills (MIT-licentie, zie `LICENSE`).

- Upstream commit: 7690c5ea14e5c842bb143dbe5725ed48fe5449db (11 okt 2026)
- Skill-versie: 49 (plugin 0.49.0)

## Bijwerken

```bash
git clone --depth 1 https://github.com/homeassistant-ai/skills.git /tmp/ha-skills
rsync -a --delete --exclude LICENSE --exclude UPSTREAM.md \
  /tmp/ha-skills/skills/home-assistant-best-practices/ \
  .claude/skills/home-assistant-best-practices/
```

Pas daarna de commit-hash hierboven aan.
