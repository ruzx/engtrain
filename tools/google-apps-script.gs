/**
 * Приём ответов учеников в Google-таблицу (английский). Подходит для одного и для многих учеников.
 *
 * Установка (5 минут, один раз):
 * 1. Создайте новую Google-таблицу.
 * 2. Расширения → Apps Script. Удалите всё и вставьте этот файл. Сохраните.
 * 3. Запустите функцию setup (кнопка «Выполнить») и разрешите доступ.
 * 4. Начать развёртывание → Новое развёртывание → тип «Веб-приложение».
 *    Выполнять как: «Я». Доступ: «Все». Нажмите «Развернуть», скопируйте URL (…/exec).
 * 5. Вставьте URL в content/manifest.json → "reportUrl" и опубликуйте сайт.
 *
 * Листы:
 *  «Ответы»   — все ответы всех учеников (по строке на ответ).
 *  «Сводка»   — точность по ученикам и навыкам, уверенные ошибки, активность по дням.
 *  «Ученики»  — впишите адрес сайта и имена: получите персональные ссылки (имя подставится само).
 *  «👤 Имя»   — отдельный лист для каждого ученика, создаётся автоматически.
 */
const HEAD = ['Дата', 'Ученик', 'Тема', 'Навык', 'Тип', 'Задание', 'Ответ ученика', 'Результат', 'Верно (0–1)', 'Баллы', 'Уверен', 'Время, с', 'ID', 'Устройство'];
const KINDS = { q: 'задание', c: 'карточка', x: 'эксперимент', l: 'урок' };
const PER_STUDENT_SHEETS = true;

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const a = ss.getSheetByName('Ответы') || ss.insertSheet('Ответы', 0);
  if (a.getLastRow() === 0) header(a);

  const s = ss.getSheetByName('Сводка') || ss.insertSheet('Сводка', 1);
  s.clear();
  s.getRange('A1').setValue('Точность по ученикам и навыкам').setFontWeight('bold');
  s.getRange('A2').setFormula("=IFERROR(QUERY('Ответы'!A:N,\"select B, C, D, count(I), avg(I) where B is not null and E = 'задание' group by B, C, D order by B, avg(I) label count(I) 'Попыток', avg(I) 'Точность'\",1),\"нет данных\")");
  s.getRange('H1').setValue('Уверенные ошибки').setFontWeight('bold');
  s.getRange('H2').setFormula("=IFERROR(QUERY('Ответы'!A:N,\"select A, B, F, G where K = 'да' and I < 1 order by A desc limit 60\",1),\"нет данных\")");
  s.getRange('M1').setValue('Активность по дням').setFontWeight('bold');
  s.getRange('M2').setFormula("=IFERROR(QUERY('Ответы'!A:N,\"select B, toDate(A), count(A), avg(I) where B is not null group by B, toDate(A) order by toDate(A) desc label toDate(A) 'День', count(A) 'Ответов', avg(I) 'Точность'\",1),\"нет данных\")");
  s.getRange('R1').setValue('Итог по ученикам').setFontWeight('bold');
  s.getRange('R2').setFormula("=IFERROR(QUERY('Ответы'!A:N,\"select B, count(A), avg(I), max(A) where B is not null group by B order by B label count(A) 'Ответов', avg(I) 'Точность', max(A) 'Последний ответ'\",1),\"нет данных\")");

  const u = ss.getSheetByName('Ученики') || ss.insertSheet('Ученики', 2);
  if (u.getLastRow() === 0) {
    u.getRange('A1:B1').setValues([['Адрес сайта →', 'https://ЛОГИН.github.io/РЕПОЗИТОРИЙ/']]);
    u.getRange('A3:B3').setValues([['Имя ученика', 'Персональная ссылка']]).setFontWeight('bold');
    u.getRange('B4').setFormula('=ARRAYFORMULA(IF(A4:A="",,$B$1&"?s="&ENCODEURL(A4:A)))');
    u.setColumnWidth(1, 220); u.setColumnWidth(2, 460);
  }
}

function header(sh) {
  sh.appendRow(HEAD); sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold');
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName('Ответы');
    if (!sh) { setup(); sh = ss.getSheetByName('Ответы'); }
    const items = JSON.parse(e.postData.contents);
    const rows = (Array.isArray(items) ? items : [items]).map(x => [
      new Date(x.t || Date.now()),
      String(x.student || 'без имени').slice(0, 80),
      x.moduleName || x.module || '',
      x.skillName || x.skill || '',
      KINDS[x.kind] || x.kind || '',
      String(x.text || '').slice(0, 300),
      String(x.answer ?? '').slice(0, 100),
      x.ok === 1 ? 'верно' : x.ok > 0 ? 'частично' : 'неверно',
      Number(x.ok) || 0,
      x.max ? `${x.score}/${x.max}` : '',
      x.sure ? 'да' : 'нет',
      x.ms ? Math.round(x.ms / 1000) : '',
      x.id || '',
      x.device || '',
    ]);
    if (!rows.length) return ContentService.createTextOutput('empty');
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEAD.length).setValues(rows);

    if (PER_STUDENT_SHEETS) {
      const byStudent = {};
      rows.forEach(r => (byStudent[r[1]] = byStudent[r[1]] || []).push(r));
      Object.keys(byStudent).forEach(name => {
        const title = ('👤 ' + name).replace(/[\[\]\*\?\/\\:]/g, ' ').slice(0, 95);
        let st = ss.getSheetByName(title);
        if (!st) { st = ss.insertSheet(title); header(st); }
        const rr = byStudent[name];
        st.getRange(st.getLastRow() + 1, 1, rr.length, HEAD.length).setValues(rr);
      });
    }
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return ContentService.createTextOutput('Приём ответов работает'); }
