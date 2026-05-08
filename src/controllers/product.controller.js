// Түсіндірме: service модулін осы файлда қолдану үшін жүктейді.
const service = require("../services/product.service");

// Түсіндірме: Асинхронды операция орындайтын функцияны анықтайды.
async function list(req, res) {
  // Түсіндірме: HTTP жауабын клиентке қайтарады.
  res.json(await service.listProducts(req.tenantId, req.query));
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
}

// Түсіндірме: Асинхронды операция орындайтын функцияны анықтайды.
async function create(req, res) {
  // Түсіндірме: HTTP жауабын клиентке қайтарады.
  res.status(201).json(await service.createProduct(req.tenantId, req.body));
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
}

// Түсіндірме: Асинхронды операция орындайтын функцияны анықтайды.
async function get(req, res) {
  // Түсіндірме: HTTP жауабын клиентке қайтарады.
  res.json(await service.getProduct(req.tenantId, req.params.id));
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
}

// Түсіндірме: Бұл файлдан сыртқа берілетін функциялар мен мәндерді көрсетеді.
module.exports = { list, create, get };
