// Түсіндірме: service модулін осы файлда қолдану үшін жүктейді.
const service = require("../services/warehouse.service");

// Түсіндірме: Асинхронды операция орындайтын функцияны анықтайды.
async function list(req, res) {
  // Түсіндірме: HTTP жауабын клиентке қайтарады.
  res.json({ data: await service.listWarehouses(req.tenantId) });
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
}

// Түсіндірме: Асинхронды операция орындайтын функцияны анықтайды.
async function create(req, res) {
  // Түсіндірме: HTTP жауабын клиентке қайтарады.
  res.status(201).json(await service.createWarehouse(req.tenantId, req.body));
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
}

// Түсіндірме: Бұл файлдан сыртқа берілетін функциялар мен мәндерді көрсетеді.
module.exports = { list, create };
