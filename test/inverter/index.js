require('dotenv').config();
const { BU } = require('base-util-jh');
const Control = require('../../src/Control');

const mainConfig = require('./config');

const controller = new Control(mainConfig);

BU.CLI(mainConfig.dbInfo);
controller
  .init(null, mainConfig.uuid)
  .then(pcsControllerList => {
    // controller.runDeviceInquiryScheduler();
    controller.inquiryAllDeviceStatus();
  })
  .catch(err => {
    BU.CLI(err);
  });

process.on('uncaughtException', err => {
  // BU.debugConsole();
  console.error(err);
  console.log('Node NOT Exiting...');
});

process.on('unhandledRejection', err => {
  // BU.debugConsole();
  console.error(err);
  console.log('Node NOT Exiting...');
});
