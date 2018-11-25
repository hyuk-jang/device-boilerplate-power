const _ = require('lodash');
const cron = require('cron');
const Promise = require('bluebird');
const moment = require('moment');

const { BU, CU } = require('base-util-jh');
const { BM } = require('base-model-jh');

const Model = require('./Model');

const PcsController = require('../PcsController');

class Control {
  /** @param {defaultManagerConfig} config */
  constructor(config) {
    // this.config = _.get(config, 'current', {});
    this.config = config;

    // 장치를 계측하기 위한 스케줄러 객체
    this.cronScheduler = null;

    /** @type {PcsController[]} */
    this.deviceControllerList = [];
    // 장치 계측이 완료되었는지 체크하기 위한 배열
    this.cronDeviceList = [];

    /** @type {deviceCommandContainerInfo[]} 현재 진행중인 명령 목록 */
    this.deviceCommandContainerList = [];
  }

  /**
   * 접속 포트 변경
   * @param {string=} targetId deviceController target_id
   * @param {string} comName 포트를 바꾸고자 할 경우
   */
  setDbConnectPort(targetId, comName) {
    // 포트 변경
    this.config.deviceConfigList.forEach(deviceControllerInfo => {
      // 포트를 지정하지 않을 경우 전체 변경
      if (_.isNil(targetId) || deviceControllerInfo.target_id === targetId) {
        _.set(deviceControllerInfo, 'connect_info.port', comName);
      }
    });
    return true;
  }

  /**
   * Passive Client를 수동으로 붙여줄 경우
   * @param {string} mainUUID Site ID
   * @param {*} passiveClient
   * @return {boolean} 성공 유무
   */
  setPassiveClient(mainUUID, passiveClient) {
    const fountIt = _.find(this.deviceControllerList, pcsController =>
      _.isEqual(pcsController.siteUUID, mainUUID),
    );

    // 해당 지점이 없다면 실패
    if (_.isEmpty(fountIt)) return false;
    // client를 binding 처리
    fountIt.bindingPassiveClient(mainUUID, passiveClient);
    return true;
  }

  /**
   * 장치 컨트롤러 리스트 생성
   * @param {dbInfo=} dbInfo
   * @param {string=} mainUUID main UUID
   */
  async init(dbInfo, mainUUID) {
    // BU.CLIS(dbInfo, mainUUID);
    // DB 정보를 입력할 경우 해당 DB에 접속하여 정보를 취득
    if (dbInfo) {
      this.config.dbInfo = dbInfo;
      const biModule = new BM(dbInfo);

      /** @type {V_PW_INVERTER_PROFILE} */
      const deviceList = await biModule.getTable(
        'v_pw_inverter_profile',
        _.isString(mainUUID) && { uuid: mainUUID },
      );
      // BU.CLI(deviceList.length);

      this.config.deviceConfigList = deviceList;
    }

    // map이 나와서 거슬림. 제거함
    this.config.deviceConfigList = _.map(this.config.deviceConfigList, deviceConfig =>
      _.omit(deviceConfig, ['map']),
    );

    // 참조할 인버터 재정의
    this.config.deviceConfigList.forEach(element => {
      // 환경 정보가 strJson이라면 변환하여 저장

      BU.IsJsonString(element.connect_info) &&
        _.set(element, 'connect_info', JSON.parse(element.connect_info));

      BU.IsJsonString(element.protocol_info) &&
        _.set(element, 'protocol_info', JSON.parse(element.protocol_info));

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
    });

    try {
      // 하부 PCS 순회
      const deviceControllerList = await Promise.map(this.config.deviceConfigList, deviceInfo => {
        const controller = new PcsController(deviceInfo);
        // 컨트롤러에 현 객체 Observer 등록
        controller.attach(this);
        return controller.init(_.get(deviceInfo, 'uuid'));
      });

      // 하부 PCS 객체 리스트 정의
      this.deviceControllerList = deviceControllerList;

      // 모델 생성 및 정의
      this.model = new Model(this);

      return this.deviceControllerList;
    } catch (error) {
      throw error;
    }
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
  runDeviceInquiryScheduler() {
    // this.measureDate = moment();
    // this.measureRegularDevice();
    try {
      if (this.cronScheduler !== null) {
        // BU.CLI('Stop')
        this.cronScheduler.stop();
      }

      // 1분마다 요청
      this.cronScheduler = new cron.CronJob(
        this.config.inquirySchedulerInfo.intervalCronFormat,
        () => {
          this.inquiryAllDeviceStatus(moment());
        },
        null,
        true,
      );

      // // 1분마다 요청
      // this.cronScheduler = cron.schedule('* * * * *', () => {
      //   this.measureDate = moment();
      //   this.inquiryAllDeviceStatus();
      // });
      // this.cronScheduler.start();
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Device Client로부터 Message 수신
   * @param {PcsController} pcsController PCS Controller 객체
   * @param {dcMessage} dcMessage 명령 수행 결과 데이터
   */
  notifyDeviceMessage(pcsController, dcMessage) {
    // BU.CLI('notifyDeviceMessage', dcMessage.msgCode);
    const {
      COMMANDSET_EXECUTION_TERMINATE,
      COMMANDSET_DELETE,
    } = pcsController.definedCommandSetMessage;

    switch (dcMessage.msgCode) {
      // 명령이 종료되거나 삭제될 경우
      case COMMANDSET_EXECUTION_TERMINATE:
      case COMMANDSET_DELETE:
        this.model.completedDeviceCommand(pcsController, dcMessage);
        break;
      default:
        break;
    }
  }

  /**
   * 정기적인 장치 리스트 계측 탐색
   * @param {moment.Moment} momentDate
   */
  inquiryAllDeviceStatus(momentDate = moment()) {
    if (process.env.LOG_DBP_INQUIRY_START === '1') {
      BU.CLI('Start DBP inquiryAllDeviceStatus');
    }
    // BU.CLI('discoveryRegularDevice');
    // 응답을 기다리는 장치 초기화
    /** @type {deviceCommandContainerInfo} */
    const deviceCommandContainer = {
      momentDate,
      deviceCommandList: [],
      timeoutTimer: null,
    };

    // 정의된 장치 컨트롤러 목록만큼 순회하면서 명령 객체 생성
    this.deviceControllerList.forEach(deviceController => {
      // 장치와 접속이 수행되지 않았다면 명령 대상에서 제외
      if (!deviceController.hasConnectedDevice) return false;

      // 고유 명령 객체 생성 및 명령 수행 요청
      const commandSet = deviceController.orderOperation({
        key: deviceController.baseModel.device.DEFAULT.KEY,
      });
      /** @type {deviceCommandEleInfo} */
      const deviceCommandEle = {
        category: deviceController.category,
        hasComplete: false,
        commandSet,
      };

      deviceCommandContainer.deviceCommandList.push(deviceCommandEle);
    });

    // 장치와의 접속이 이루어지지 않을 경우 명령 전송하지 않음
    if (deviceCommandContainer.deviceCommandList.length === 0) {
      // BU.CLI('PCS Empty Order inquiryAllDeviceStatus');
      return false;
    }
    // 무한정 기다릴 순 없으니 실패 시 Error를 발생시킬 setTimer 등록
    deviceCommandContainer.timeoutTimer = setTimeout(() => {
      deviceCommandContainer.timeoutTimer.complete = true;
      this.model.endDeviceCommand(deviceCommandContainer);
    }, 1000 * this.config.inquirySchedulerInfo.inquiryWaitingSecond);

    // 명령 목록에 추가
    this.deviceCommandContainerList.push(deviceCommandContainer);

    // new CU.Timer(
    //   () => this.model.endDeviceCommand(deviceCommandContainer),
    //   1000 * this.config.inquiryWaitingSecond,
    // );

    // 모든 장치에 계측 명령 요청
    // this.deviceControllerList.forEach(deviceController => {
    //   const commandInfoList = deviceController.converter.generationCommand(
    //     deviceController.baseModel.device.DEFAULT.COMMAND.STATUS,
    //   );
    //   const commandSet = deviceController.orderOperation(commandInfoList);
    // });
  }
}
module.exports = Control;

/**
 * @typedef {Object} deviceCommandContainerInfo
 * @property {moment.Moment} momentDate 명령 요청 시각
 * @property {Timer} timeoutTimer 정해진 시간안에 해당 명령의 응답 대기 인터벌.
 * @property {deviceCommandEleInfo[]} deviceCommandList 명령에 관련된 세부 사항
 */

/**
 * @typedef {Object} deviceCommandEleInfo 명령 세부 사항
 * @property {string} category 장치 컨트롤러 카테고리
 * @property {boolean} hasComplete 명령 완료 여부
 * @property {commandSet} commandSet 생성된 명령 고유 객체
 */
