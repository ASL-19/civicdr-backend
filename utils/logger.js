const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const directory = process.env.LOG_DIRECTORY || '.';

module.exports = processName => {
  return new winston.Logger({
    transports: [
      new winston.transports.DailyRotateFile({
        level: 'info',
        timestamp: true,
        json: false,
        filename: path.join(directory, `-${processName}-info-log`),
        datePattern: 'yyyy-MM-dd',
        prepend: true,
        name: 'info'
      }),
      new winston.transports.DailyRotateFile({
        level: 'error',
        timestamp: true,
        json: false,
        filename: path.join(directory, `-${processName}-error-log`),
        datePattern: 'yyyy-MM-dd',
        prepend: true,
        name: 'error'
      })
    ]
  });
};
