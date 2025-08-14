import React from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';

export const NotificationDemo: React.FC = () => {
  const { showSuccess, showError, showWarning, showInfo, showConfirm, alert } = useNotificationContext();

  return (
    <div className="p-4 space-y-2">
      <h3 className="text-lg font-semibold mb-4">Тест уведомлений</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => showSuccess('Успех!', 'Операция выполнена успешно')}
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Успех
        </button>
        <button
          onClick={() => showError('Ошибка!', 'Что-то пошло не так')}
          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Ошибка
        </button>
        <button
          onClick={() => showWarning('Предупреждение!', 'Будьте осторожны')}
          className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Предупреждение
        </button>
        <button
          onClick={() => showInfo('Информация', 'Полезная информация')}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Информация
        </button>
        <button
          onClick={() => showConfirm(
            'Подтверждение',
            'Вы уверены в своём выборе?',
            () => alert('Вы подтвердили!', 'success'),
            () => alert('Вы отменили', 'info')
          )}
          className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Подтверждение
        </button>
      </div>
    </div>
  );
};