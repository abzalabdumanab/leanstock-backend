// Түсіндірме: Қайта қолданылатын функцияны анықтайды.
function cursorPagination(query) {
  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const limit = Math.min(Number(query.limit) || 20, 100);
  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const cursor = query.cursor || undefined;
  // Түсіндірме: Функциядан нәтижені қайтарады.
  return { limit, cursor };
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
}

// Түсіндірме: Қайта қолданылатын функцияны анықтайды.
function buildCursorPage(items, limit) {
  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const hasNextPage = items.length > limit;
  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const data = hasNextPage ? items.slice(0, limit) : items;
  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const nextCursor = hasNextPage ? data[data.length - 1].id : null;
  // Түсіндірме: Функциядан нәтижені қайтарады.
  return { data, pagination: { limit, nextCursor, hasNextPage } };
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
}

// Түсіндірме: Қайта қолданылатын функцияны анықтайды.
function pagePagination(query) {
  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const page = Math.max(Number(query.page) || 1, 1);
  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const limit = Math.min(Number(query.limit) || 20, 100);
  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const skip = (page - 1) * limit;
  // Түсіндірме: Функциядан нәтижені қайтарады.
  return { page, limit, skip };
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
}

// Түсіндірме: Қайта қолданылатын функцияны анықтайды.
function buildPageMeta(total, page, limit) {
  // Түсіндірме: Функциядан нәтижені қайтарады.
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
}

// Түсіндірме: Бұл файлдан сыртқа берілетін функциялар мен мәндерді көрсетеді.
module.exports = { cursorPagination, buildCursorPage, pagePagination, buildPageMeta };
