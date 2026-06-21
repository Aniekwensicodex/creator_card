'use strict';

require('dotenv').config();

const { app } = require('./app');
const { connectDB } = require('./config/database');
const { appLogger } = require('./core/logger');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await connectDB();
    appLogger.info({ msg: 'Database connected' }, 'bootstrap');

    app.listen(PORT, () => {
      appLogger.info({ msg: `Server running on port ${PORT}` }, 'bootstrap');
    });
  } catch (err) {
    appLogger.errorX(err, 'bootstrap');
    process.exit(1);
  }
}

bootstrap();
