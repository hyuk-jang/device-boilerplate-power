/** @type {defaultManagerConfig} */
const config = {
  dbInfo: {
    host: process.env.WEB_DB_HOST || 'localhost',
    user: process.env.WEB_DB_USER || 'root',
    password: process.env.WEB_DB_PW || 'smsoftware',
    database: process.env.WEB_DB_DB || 'test',
  },
  uuid: '001',
  inquiryIntervalSecond: 60,
  inquiryWaitingSecond: 60,
  deviceConfigList: [
    {
      inverter_seq: 1,
      target_id: 'IVT_001',
      target_name: '고정식',
      target_category: 'inverter',
      connect_info:
        '{"type":"socket","subType":"","host":"localhost","port":9000,"hasPassive":false}',
      protocol_info:
        '{"mainCategory":"Inverter","subCategory":"das_1.3","wrapperCategory":"default","deviceId":"001"}',
      install_place: null,
      serial_number: null,
      amount: 33,
      director_name: null,
      director_tel: null,
      chart_color: '#212529',
      chart_sort_rank: 1,
    },
    {
      inverter_seq: 2,
      target_id: 'IVT_002',
      target_name: '가변식',
      target_category: 'inverter',
      connect_info:
        '{"type":"socket","subType":"","host":"localhost","port":9000,"hasPassive":false}',
      protocol_info:
        '{"mainCategory":"Inverter","subCategory":"das_1.3","wrapperCategory":"default","deviceId":"002"}',
      install_place: null,
      serial_number: null,
      amount: 33,
      director_name: null,
      director_tel: null,
      chart_color: '#a61e4d',
      chart_sort_rank: 2,
    },
    {
      inverter_seq: 3,
      target_id: 'IVT_003',
      target_name: '수평',
      target_category: 'inverter',
      connect_info:
        '{"type":"socket","subType":"","host":"localhost","port":9000,"hasPassive":false}',
      protocol_info:
        '{"mainCategory":"Inverter","subCategory":"das_1.3","wrapperCategory":"default","deviceId":"003"}',
      install_place: null,
      serial_number: null,
      amount: 33,
      director_name: null,
      director_tel: null,
      chart_color: '#5f3dc4',
      chart_sort_rank: 3,
    },
    {
      inverter_seq: 4,
      target_id: 'IVT_004',
      target_name: '외부',
      target_category: 'inverter',
      connect_info:
        '{"type":"socket","subType":"","host":"localhost","port":9000,"hasPassive":false}',
      protocol_info:
        '{"mainCategory":"Inverter","subCategory":"das_1.3","wrapperCategory":"default","deviceId":"001"}',
      install_place: null,
      serial_number: null,
      amount: 33,
      director_name: null,
      director_tel: null,
      chart_color: '#0b7285',
      chart_sort_rank: 4,
    },
    {
      inverter_seq: 5,
      target_id: 'IVT_005',
      target_name: '외부',
      target_category: 'inverter',
      connect_info:
        '{"type":"socket","subType":"","host":"localhost","port":9000,"hasPassive":false}',
      protocol_info:
        '{"mainCategory":"Inverter","subCategory":"das_1.3","wrapperCategory":"default","deviceId":"001"}',
      install_place: null,
      serial_number: null,
      amount: 33,
      director_name: null,
      director_tel: null,
      chart_color: '#2b8a3e',
      chart_sort_rank: 5,
    },
    {
      inverter_seq: 6,
      target_id: 'IVT_006',
      target_name: '1',
      target_category: 'inverter',
      connect_info:
        '{"type":"socket","subType":"","host":"localhost","port":9000,"hasPassive":false}',
      protocol_info:
        '{"mainCategory":"Inverter","subCategory":"das_1.3","wrapperCategory":"default","deviceId":"001"}',
      install_place: null,
      serial_number: null,
      amount: 33,
      director_name: null,
      director_tel: null,
      chart_color: '#e67700',
      chart_sort_rank: 6,
    },
    {
      inverter_seq: 7,
      target_id: 'IVT_007',
      target_name: '2',
      target_category: 'inverter',
      connect_info:
        '{"type":"socket","subType":"","host":"localhost","port":9000,"hasPassive":false}',
      protocol_info:
        '{"mainCategory":"Inverter","subCategory":"das_1.3","wrapperCategory":"default","deviceId":"002"}',
      install_place: null,
      serial_number: null,
      amount: 33,
      director_name: null,
      director_tel: null,
      chart_color: '#d9480f',
      chart_sort_rank: 7,
    },
    {
      inverter_seq: 8,
      target_id: 'IVT_008',
      target_name: '3',
      target_category: 'inverter',
      connect_info:
        '{"type":"socket","subType":"","host":"localhost","port":9000,"hasPassive":false}',
      protocol_info:
        '{"mainCategory":"Inverter","subCategory":"das_1.3","wrapperCategory":"default","deviceId":"003"}',
      install_place: null,
      serial_number: null,
      amount: 33,
      director_name: null,
      director_tel: null,
      chart_color: '#c92a2a',
      chart_sort_rank: 8,
    },
    {
      inverter_seq: 9,
      target_id: 'IVT_009',
      target_name: '일반 구조물',
      target_category: 'inverter',
      connect_info:
        '{"type":"socket","subType":"","host":"localhost","port":9000,"hasPassive":false}',
      protocol_info:
        '{"mainCategory":"Inverter","subCategory":"das_1.3","wrapperCategory":"default","deviceId":"001"}',
      install_place: null,
      serial_number: null,
      amount: 33,
      director_name: null,
      director_tel: null,
      chart_color: '#868e96',
      chart_sort_rank: 9,
    },
    {
      inverter_seq: 10,
      target_id: 'IVT_010',
      target_name: '태양광 구조물',
      target_category: 'inverter',
      connect_info:
        '{"type":"socket","subType":"","host":"localhost","port":9000,"hasPassive":false}',
      protocol_info:
        '{"mainCategory":"Inverter","subCategory":"das_1.3","wrapperCategory":"default","deviceId":"002"}',
      install_place: null,
      serial_number: null,
      amount: 33,
      director_name: null,
      director_tel: null,
      chart_color: '#b9560d',
      chart_sort_rank: 10,
    },
    {
      inverter_seq: 11,
      target_id: 'IVT_011',
      target_name: '외부',
      target_category: 'inverter',
      connect_info:
        '{"type":"socket","subType":"","host":"localhost","port":9000,"hasPassive":false}',
      protocol_info:
        '{"mainCategory":"Inverter","subCategory":"das_1.3","wrapperCategory":"default","deviceId":"003"}',
      install_place: null,
      serial_number: null,
      amount: 33,
      director_name: null,
      director_tel: null,
      chart_color: '#3bc9db',
      chart_sort_rank: 11,
    },
  ],
};
module.exports = config;
