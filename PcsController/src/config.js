/** @type {defaultControlConfig} */
const mainConfig = {
  target_id: 'IVT_001',
  target_name: '인버터 계측 프로그램',
  target_category: 'inverter',
  logOption: {
    hasCommanderResponse: true,
    hasDcError: true,
    hasDcEvent: true,
    hasReceiveData: true,
    hasDcMessage: true,
    hasTransferCommand: true,
  },
  controlInfo: {
    hasErrorHandling: true,
    hasOneAndOne: false,
    hasReconnect: true,
  },
  protocol_info: {
    mainCategory: 'Inverter',
    subCategory: 'das_1.3',
    wrapperCategory: 'default',
    deviceId: '001',
    protocolOptionInfo: {
      hasTrackingData: true,
    },
  },
  // connect_info: {
  //   type: 'serial',
  //   baudRate: 19200,
  //   port: 'COM8'
  // },
  connect_info: {
    type: 'socket',
    port: 9000,
  },
};
module.exports = mainConfig;
