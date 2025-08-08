# Flow Timer

Лёгкий таймер продуктивности с задачами, целями, историей сессий, темами и настраиваемым акцентным цветом. Технологии: Vite, React, TypeScript, Tailwind.

[English](README.md) | Русский

## Скрипты

- Разработка: `npm run dev`
- Продакшен-сборка: `npm run build`
- Предпросмотр: `npm run preview`
- Линт: `npm run lint`

## Документация

- Обзор архитектуры: [docs/Architecture.md](docs/Architecture.md)
- Публичное API: [docs/API.md](docs/API.md)
- Гайд по акцентам: [docs/accent-usage.md](docs/accent-usage.md)
- Дизайн музыкального плеера: [docs/music-player.md](docs/music-player.md)

## Карта проекта

- Композиция приложения: [src/App.tsx](src/App.tsx)
- Входная точка: [src/main.tsx](src/main.tsx), обработчик ошибок: [src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx)
- Хуки:
  - [src/hooks/useLocalStorage.ts](src/hooks/useLocalStorage.ts)
  - [src/hooks/useTasks.ts](src/hooks/useTasks.ts)
  - [src/hooks/useTimer.ts](src/hooks/useTimer.ts)
  - [src/hooks/useTheme.ts](src/hooks/useTheme.ts)
- UI:
  - [src/components/Timer.tsx](src/components/Timer.tsx)
  - [src/components/TaskManager.tsx](src/components/TaskManager.tsx)
  - [src/components/History.tsx](src/components/History.tsx)
  - [src/components/SettingsPanel.tsx](src/components/SettingsPanel.tsx)
  - [src/components/MusicPlayer.tsx](src/components/MusicPlayer.tsx)

## Ключевые концепции

- Задача: элемент работы с необязательной целью (в секундах). Сессии суммируются в историю; прогресс за сегодня использует только сегодняшние значения.
- Сессия: фиксируется при остановке рабочего интервала; перерыв вычисляется как floor(workedSeconds / 5).
- Настройки: тема, акцент, режим тени, цвет таймера, уведомления.
- Ключи хранения: см. [docs/API.md](docs/API.md).

## Дев-конвенции

- Типы `Task`, `Session`, `Settings` централизованы в [src/App.tsx](src/App.tsx).
- TSDoc: у компонентов и хуков есть описания обязанностей, входов/выходов и сайд-эффектов.
- Тёмная тема: `useTheme` ставит `data-theme` и переключает `html.dark` для Tailwind.
- Акцентные цвета: используйте соответствия токен-класс; зелёный может иметь инлайн-hex при необходимости.

## Безопасные изменения

- Меняя модель данных в [src/App.tsx](src/App.tsx), обновляйте:
  - Соответствующие хуки
  - Пропсы компонентов
  - Документацию: [docs/API.md](docs/API.md), [docs/Architecture.md](docs/Architecture.md)
- Механика таймера/перерыва: см. [src/hooks/useTimer.ts](src/hooks/useTimer.ts)
- Стили:
  - Общие правила переходов цвета: [src/index.css](src/index.css)
  - Карты классов акцента и темы расположены рядом с компонентами

## Уведомления и приватность

- Визуальные уведомления используют Web Notifications API; разрешение запрашивается при монтировании.
- Аудио-уведомления используют Web Audio API и могут быть отключены в настройках.
- Все данные сохраняются в LocalStorage на устройстве; бэкенда нет. Очистка хранилища стирает задачи/сессии/настройки.

## Лицензия

MIT

