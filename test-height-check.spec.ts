import { test, expect } from '@playwright/test';

test('Check History window heights for different views', async ({ page }) => {
  // Открываем приложение
  await page.goto('http://localhost:5173');
  
  // Ждем загрузки
  await page.waitForLoadState('networkidle');
  
  // Проверяем, что страница загрузилась
  await expect(page).toHaveTitle(/Task Manager/);
  
  // Ищем кнопку History
  const historyButton = page.locator('button:has-text("History")');
  await expect(historyButton).toBeVisible();
  
  // Открываем History
  await historyButton.click();
  
  // Ждем появления модального окна
  await page.waitForSelector('.history-modal');
  
  // Получаем размеры контейнера контента для каждого режима
  const contentContainer = page.locator('.history-modal .p-6.overflow-y-auto');
  
  // Проверяем Day режим
  await page.click('button:has-text("Day")');
  await page.waitForTimeout(500); // Ждем анимации
  const dayHeight = await contentContainer.evaluate(el => el.scrollHeight);
  console.log('Day view height:', dayHeight);
  
  // Проверяем Week режим
  await page.click('button:has-text("Week")');
  await page.waitForTimeout(500); // Ждем анимации
  const weekHeight = await contentContainer.evaluate(el => el.scrollHeight);
  console.log('Week view height:', weekHeight);
  
  // Проверяем Month режим
  await page.click('button:has-text("Month")');
  await page.waitForTimeout(500); // Ждем анимации
  const monthHeight = await contentContainer.evaluate(el => el.scrollHeight);
  console.log('Month view height:', monthHeight);
  
  // Выводим разницу
  console.log('Difference Day vs Week:', Math.abs(dayHeight - weekHeight));
  console.log('Difference Day vs Month:', Math.abs(dayHeight - monthHeight));
  console.log('Difference Week vs Month:', Math.abs(weekHeight - monthHeight));
  
  // Делаем скриншоты для визуальной проверки
  await page.screenshot({ path: 'day-view.png' });
  await page.click('button:has-text("Week")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'week-view.png' });
  await page.click('button:has-text("Month")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'month-view.png' });
});
