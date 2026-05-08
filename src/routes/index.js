const express = require("express");
const authenticate = require("../middleware/auth");
const authRoutes = require("./auth.routes");
const productRoutes = require("./product.routes");
const warehouseRoutes = require("./warehouse.routes");
const stockRoutes = require("./stock.routes");
const transferRoutes = require("./transfer.routes");
const adjustmentRoutes = require("./adjustment.routes");
const supplierRoutes = require("./supplier.routes");
const reportRoutes = require("./report.routes");
const adminRoutes = require("./admin.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/products", authenticate, productRoutes);
router.use("/warehouses", authenticate, warehouseRoutes);
router.use("/stock", authenticate, stockRoutes);
router.use("/transfers", authenticate, transferRoutes);
router.use("/adjustments", authenticate, adjustmentRoutes);
router.use("/suppliers", authenticate, supplierRoutes);
router.use("/reports", authenticate, reportRoutes);
router.use("/admin", authenticate, adminRoutes);

module.exports = router;
