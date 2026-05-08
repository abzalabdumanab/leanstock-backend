// Түсіндірме: path модулін осы файлда қолдану үшін жүктейді.
const path = require("path");
// Түсіндірме: compression модулін осы файлда қолдану үшін жүктейді.
const compression = require("compression");
// Түсіндірме: cors модулін осы файлда қолдану үшін жүктейді.
const cors = require("cors");
// Түсіндірме: express модулін осы файлда қолдану үшін жүктейді.
const express = require("express");
// Түсіндірме: helmet модулін осы файлда қолдану үшін жүктейді.
const helmet = require("helmet");
// Түсіндірме: swaggerUi модулін осы файлда қолдану үшін жүктейді.
const swaggerUi = require("swagger-ui-express");
// Түсіндірме: YAML модулін осы файлда қолдану үшін жүктейді.
const YAML = require("yamljs");
// Түсіндірме: env модулін осы файлда қолдану үшін жүктейді.
const env = require("./config/env");
// Түсіндірме: routes модулін осы файлда қолдану үшін жүктейді.
const routes = require("./routes");
// Түсіндірме: { notFound, errorHandler } модулін осы файлда қолдану үшін жүктейді.
const { notFound, errorHandler } = require("./middleware/errorHandler");

// Түсіндірме: Қайта қолданылатын функцияны анықтайды.
function createApp() {
  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const app = express();

  // Түсіндірме: Express қолданбасына middleware немесе маршрутты қосады.
  app.use(helmet());
  // Түсіндірме: Express қолданбасына middleware немесе маршрутты қосады.
  app.use(compression());
  // Түсіндірме: Express қолданбасына middleware немесе маршрутты қосады.
  app.use(cors({
    // Түсіндірме: Код блогын немесе объект құрылымын бастайды.
    origin(origin, callback) {
      // Түсіндірме: Шартты тексеріп, орындалатын тармақты бастайды.
      if (!origin || env.corsOrigins.includes(origin)) {
        // Түсіндірме: Функциядан нәтижені қайтарады.
        return callback(null, true);
      // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
      }
      // Түсіндірме: Функциядан нәтижені қайтарады.
      return callback(new Error("CORS origin is not allowed"));
    // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
    },
    // Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
    credentials: true
  // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
  }));
  // Түсіндірме: Express қолданбасына middleware немесе маршрутты қосады.
  app.use(express.json({ limit: "1mb" }));

  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const openapi = YAML.load(path.join(__dirname, "..", "openapi.yaml"));
  // Түсіндірме: Express қолданбасына middleware немесе маршрутты қосады.
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));
  // Түсіндірме: GET сұранысына арналған endpoint анықтайды.
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  // Түсіндірме: Express қолданбасына middleware немесе маршрутты қосады.
  app.use("/api/v1", routes);
  // Түсіндірме: Express қолданбасына middleware немесе маршрутты қосады.
  app.use(notFound);
  // Түсіндірме: Express қолданбасына middleware немесе маршрутты қосады.
  app.use(errorHandler);

  // Түсіндірме: Функциядан нәтижені қайтарады.
  return app;
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
}

// Түсіндірме: Бұл файлдан сыртқа берілетін функциялар мен мәндерді көрсетеді.
module.exports = createApp;
