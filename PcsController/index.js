const Control = require('./src/Control');

module.exports = Control;

// if __main process
if (require !== undefined && require.main === module) {
  console.log('__main__');
  const {BU} = require('base-util-jh');
  const mainConfig = require('./src/config');
  const controller = new Control(mainConfig);

  controller
    .init()
    .then(hasConnected => {
      // console.trace(hasConnected);
      // BU.CLI(controller.baseModel.device.DEFAULT.COMMAND.STATUS);
      const command = controller.converter.generationCommand(
        controller.baseModel.device.DEFAULT.COMMAND.STATUS,
      );
      BU.CLIN(command);
      controller.orderOperation(command);
    })
    .catch(err => {
      BU.CLI(err);
      BU.CLI(controller.hasConnectedDevice);
    });

  // process.on('uncaughtException', err => {
  //   // BU.debugConsole();
  //   console.error(err.stack);
  //   console.log(err.message);
  //   console.log('Node NOT Exiting...');
  // });

  // process.on('unhandledRejection', err => {
  //   // BU.debugConsole();
  //   console.error(err.stack);
  //   console.log(err.message);
  //   console.log('Node NOT Exiting...');
  // });
}
