const Control = require('./src/Control');

module.exports = Control;

// if __main process
if (require !== undefined && require.main === module) {
  console.log('__main__');
  require('dotenv').config();
  const { BU } = require('base-util-jh');

  const mainConfig = require('./src/config');
  const controller = new Control(mainConfig);

  BU.CLI(mainConfig.dbInfo);
  controller
    .init(mainConfig.dbInfo, mainConfig.uuid)
    .then(pcsControllerList => {
      controller.runDeviceInquiryScheduler();
      // controller.inquiryAllDeviceStatus();
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
}
