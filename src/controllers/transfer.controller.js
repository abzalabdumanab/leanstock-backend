// Түсіндірме: service модулін осы файлда қолдану үшін жүктейді.
const service = require("../services/transfer.service");

// Түсіндірме: Асинхронды операция орындайтын функцияны анықтайды.
async function list(req, res) {
  // Түсіндірме: HTTP жауабын клиентке қайтарады.
  res.json(await service.listTransfers(req.tenantId, req.query));
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
}

// Түсіндірме: Асинхронды операция орындайтын функцияны анықтайды.
async function create(req, res) {
  // Түсіндірме: HTTP жауабын клиентке қайтарады.
  res.status(201).json(await service.createTransfer(req.tenantId, req.user.id, req.body));
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
}

// Түсіндірме: Асинхронды операция орындайтын функцияны анықтайды.
async function confirm(req, res) {
  // Түсіндірме: HTTP жауабын клиентке қайтарады.
  res.json(await service.confirmTransfer(req.tenantId, req.params.id));
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
}

// Түсіндірме: Асинхронды операция орындайтын функцияны анықтайды.
async function reject(req, res) {
  // Түсіндірме: HTTP жауабын клиентке қайтарады.
  res.json(await service.rejectTransfer(req.tenantId, req.params.id));
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
}

// Түсіндірме: Бұл файлдан сыртқа берілетін функциялар мен мәндерді көрсетеді.
module.exports = { list, create, confirm, reject };
