import { createApp } from "./app.js";
import { getConfig } from "./config.js";
import { startGmailWorker } from "./gmail.js";

const config = getConfig();
const app = createApp(config);

startGmailWorker({ db: app.locals.db, config });

app.listen(config.port, config.host, () => {
  console.log(`Command Information Center listening on http://${config.host}:${config.port}`);
});
