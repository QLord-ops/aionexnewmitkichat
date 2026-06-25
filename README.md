# AIONEX Website

Готовый статический лендинг по предоставленным референсам.

## Запуск

Откройте `index.html` в браузере или запустите папку через любой локальный веб-сервер.

## Структура

- `index.html` — разметка сайта
- `styles.css` — дизайн и адаптив
- `script.js` — мобильное меню, FAQ и анимации
- `assets/consultant.png` — оригинальное hero-изображение с прозрачным фоном
- `backend/server.py` — потоковый API для AIONEX KI-Assistent
- `start-chatbot.ps1` — запуск backend чат-бота

## Запуск KI-Assistent

1. Скопируйте `backend/.env.example` в `backend/.env`.
2. Добавьте в `.env` значение `OPENAI_API_KEY`.
3. Запустите `start-chatbot.ps1`.
4. Откройте сайт и нажмите круглую кнопку `AI` в правом нижнем углу.

Для опубликованного сайта укажите адрес backend перед `script.js`:

```html
<script>window.AIONEX_CHAT_API = "https://bot.example.com";</script>
```

Контактные данные, ссылки на Impressum/Datenschutz и реальные логотипы компаний сейчас используются как демонстрационные и требуют замены перед публикацией.
