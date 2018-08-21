const _ = require('lodash');
const cron = require('cron');
const Promise = require('bluebird');

const { BU } = require('base-util-jh');
const { BM } = require('base-model-jh');

const moment = require('moment');
const Model = require('./Model');

const PcsController = require('../PcsController');

class Control {
  /** @param {defaultManagerConfig} config */
  constructor(config) {
    // this.config = _.get(config, 'current', {});
    this.config = config;

    // 장치를 계측하기 위한 스케줄러 객체
    this.cronScheduler = null;

    /** @type {Array.<PcsController>} */
    this.deviceControllerList = [];
    // 장치 계측이 완료되었는지 체크하기 위한 배열
    this.cronDeviceList = [];
  }

  /**
   * 접속 포트 변경
   * @param {string=} targetId deviceController deviceInfo target_id
   * @param {string} comName 포트를 바꾸고자 할 경우
   */
  setDbConnectPort(targetId, comName) {
    // 포트 변경
    this.config.deviceControllerList.forEach(deviceControllerInfo => {
      // 포트를 지정하지 않을 경우 전체 변경
      if (_.isNil(targetId) || deviceControllerInfo.deviceInfo.target_id === targetId) {
        _.set(deviceControllerInfo, 'deviceInfo.connect_info.port', comName);
      }
    });
    return true;
  }

  /**
   * 장치 컨트롤러 리스트 생성
   * @param {dbInfo=} dbInfo
   * @param {string} mainUuid main UUID
   */
  async init(dbInfo, mainUuid) {
    // DB 정보를 입력할 경우 해당 DB에 접속하여 정보를 취득
    if (dbInfo) {
      this.config.dbInfo = dbInfo;
      const biModule = new BM(dbInfo);

      const returnValue = [];
      const deviceList = await biModule.getTable('v_pw_inverter_profile', { uuid: mainUuid });
      deviceList.forEach(element => {
        element.protocol_info = JSON.parse(_.get(element, 'protocol_info'));
        element.connect_info = JSON.parse(_.get(element, 'connect_info'));
        element.logOption = {
          hasCommanderResponse: true,
          hasDcError: true,
          hasDcEvent: true,
          hasReceiveData: true,
          hasDcMessage: true,
          hasTransferCommand: true,
        };
        element.controlInfo = {
          hasErrorHandling: true,
          hasOneAndOne: false,
          hasReconnect: true,
        };
        // element.protocol_info = _.replace() _.get(element, 'protocol_info') ;
        const addObj = {
          hasDev: true,
          deviceInfo: element,
        };

        returnValue.push(addObj);
      });

      this.config.deviceControllerList = returnValue;
    }

    try {
      // 하부 PCS 순회
      const resultInitPcsList = await Promise.map(
        this.config.deviceControllerList,
        deviceControllerInfo => {
          const controller = new PcsController(deviceControllerInfo);
          // 컨트롤러에 현 객체 Observer 등록
          controller.attach(this);
          return controller.init();
        }
      );

      // 하부 PCS 객체 리스트 정의
      this.deviceControllerList = resultInitPcsList;

      // 모델 생성 및 정의
      this.model = new Model(this);

      return this.deviceControllerList;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 장치 설정 값에 따라 장치 계측 컨트롤러 생성 및 계측 스케줄러 실행
   * @returns {Promise} 장치 계측 컨트롤러 생성 결과 Promise
   */
  async createDeviceController() {
    // BU.CLI('createInverterController');
    this.config.deviceControllerList.forEach(deviceControllerInfo => {
      const deviceController = new PcsController(deviceControllerInfo);
      deviceController.init();
      deviceController.attach(this);
      this.deviceControllerList.push(deviceController);
    });

    // FIXME: 시스템 초기화 후 5초 후에 장치 계측 스케줄러 실행. 초기화 완료 후 구동되게끔 변경
    Promise.delay(1000 * 5).then(() => {
      this.runCronDiscoveryRegularDevice();
    });
  }

  /**
   * 장치로부터 계측 명령을 완료했다고 알려옴
   * @param {Device} device
   */
  notifyDeviceData(device) {
    // BU.CLI('notifyDeviceData', device.id);
    // 알려온 Inverter 데이터가
    _.remove(this.cronDeviceList, cronDevice => {
      if (_.isEqual(cronDevice, device)) {
        // 장치 데이터 모델에 반영
        this.model.onDeviceData(device);
        return true;
      }
    });

    // 모든 장치의 계측이 완료되었다면
    // TODO: length 0 이 되기전 스케줄러가 실행될 경우 리셋되는 문제 해결 필요
    // BU.CLI(this.cronDeviceList.length);
    if (this.cronDeviceList.length === 0) {
      this.model.updateDeviceCategory(this.measureDate, 'inverter');
    }
  }

  /**
   * 장치로부터 계측 명령을 완료했다고 알려옴
   * TODO 에러 처리 필요할 경우 기입
   * @param {Device} device
   * @param {dcError} dcError
   */
  notifyDeviceError(device, dcError) {}

  /**
   * 하부 장치 조회 스케줄러 동작
   */
  runCronDiscoveryRegularDevice() {
    // this.measureDate = moment();
    // this.measureRegularDevice();
    try {
      if (this.cronScheduler !== null) {
        // BU.CLI('Stop')
        this.cronScheduler.stop();
      }
      // 1분마다 요청
      this.cronScheduler = new cron.CronJob({
        cronTime: '0 */1 * * * *',
        onTick: () => {
          this.measureDate = moment();
          this.discoveryRegularDevice();
        },
        start: true,
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 정기적인 장치 리스트 계측 탐색
   */
  discoveryRegularDevice() {
    BU.CLI('discoveryRegularDevice');
    // 응답을 기다리는 장치 초기화
    this.cronDeviceList = _.clone(this.deviceControllerList);

    // Promise.map(this.deviceControllerList, inverter => {
    //   BU.CLI('@@@@@@@@@@@@@@@@@@@', this.deviceControllerList.length);
    //   BU.CLIN(inverter, 2);
    //   let commandInfoList = inverter.converter.generationCommand(inverter.baseModel.BASE.DEFAULT.COMMAND.STATUS);
    //   return inverter.orderOperation(commandInfoList);
    // });

    // 모든 장치에 계측 명령 요청
    // FIXME: 모든 장치 Promise 바인딩 필요
    this.deviceControllerList.forEach(deviceController => {
      const commandInfoList = deviceController.converter.generationCommand(
        deviceController.baseModel.device.DEFAULT.COMMAND.STATUS
      );
      deviceController.orderOperation(commandInfoList);
    });
  }
}
module.exports = Control;
