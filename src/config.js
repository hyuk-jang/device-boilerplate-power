module.exports = {
  current: {
    dbInfo: {
      host: process.env.INVERTER_HOST ? process.env.INVERTER_HOST : 'localhost',
      user: process.env.INVERTER_USER ? process.env.INVERTER_USER : 'root',
      password: process.env.INVERTER_PW ? process.env.INVERTER_PW : 'smsoftware',
      database: process.env.INVERTER_DB ? process.env.INVERTER_DB : 'pv_led',
    },
    uuid: 'aaaaa',
    deviceControllerList: [
      {
        hasDev: false,
        deviceInfo: {
          inverter_seq: 1,
          target_id: 'PCS_001',
          target_name: '600W 급',
          target_category: 'PCS',
          protocol_info: {
            mainCategory: 'ess',
            subCategory: 'das_pv_led',
            deviceId: '000',
            protocolOptionInfo: {
              hasTrackingData: true,
            },
            option: {
              isUseKw: false,
            },
          },
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
          connect_info: {
            type: 'socket',
            port: 9000,
          },
          code: '123',
          amount: 6000,
          director_name: '에스엠소프트',
          director_tel: '061-285-3411',
          chart_color: 'black',
          chart_sort_rank: 1,
        },
      },
      {
        hasDev: false,
        deviceInfo: {
          inverter_seq: 2,
          target_id: 'PCS_002',
          target_name: '3.3 kW 급',
          target_category: 'PCS',
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
            mainCategory: 'ess',
            subCategory: 'das_pv_led',
            deviceId: '002',
            protocolOptionInfo: {
              hasTrackingData: true,
            },
            option: {
              isUseKw: false,
            },
          },
          connect_info: {
            type: 'socket',
            port: 9000,
          },
          code: '234',
          amount: 33000,
          director_name: '에스엠소프트',
          director_tel: '061-285-3411',
          chart_color: 'red',
          chart_sort_rank: 2,
        },
      },
    ],
  },
};
