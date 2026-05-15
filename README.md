# BeePlan web

SPA на **Vite + React + TypeScript** для просмотра телеметрии.

Общая документация проекта: [**beeplan-docs**](https://github.com/4sidora/beeplan-docs).

## Запуск

```bash
cd beeplan-web
cp .env.example .env   # при необходимости поправьте VITE_API_URL
npm install
npm run dev
```

После входа выберите пасеку и семью — отобразится график `temperature_c`, если точки уже попали в API (через `seed_dev` и/или концентратор).
