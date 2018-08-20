const Control = require('./src/Control');

module.exports = Control;

// if __main process
if (require !== undefined && require.main === module) {
  console.log('__main__');

  const mainConfig = require('./src/config');
  const controller = new Control(mainConfig);

  controller.init();

  setTimeout(() => {
    const command = controller.converter.generationCommand(
      controller.baseModel.device.DEFAULT.COMMAND.STATUS,
    );
    controller.orderOperation(command);
  }, 1000);

  process.on('uncaughtException', err => {
    // BU.debugConsole();
    console.error(err.stack);
    console.log(err.message);
    console.log('Node NOT Exiting...');
  });

  process.on('unhandledRejection', err => {
    // BU.debugConsole();
    console.error(err.stack);
    console.log(err.message);
    console.log('Node NOT Exiting...');
  });
}
