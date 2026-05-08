// Түсіндірме: Бұл файлдан сыртқа берілетін функциялар мен мәндерді көрсетеді.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
