const _ = require('lodash');
const {BU} = require('base-util-jh');

const EchoServer = require('../../../device-echo-server-jh');
// const AbstDeviceClient = require('device-client-controller-jh');
const AbstDeviceClient = require('../../../device-client-controller-jh');

// const {AbstConverter, BaseModel} = require('device-protocol-converter-jh');
const {AbstConverter, BaseModel} = require('../../../device-protocol-converter-jh');

const Model = require('./Model');
const mainConfig = require('./config');

class Control extends AbstDeviceClient {
  /** @param {defaultControlConfig} config */
  constructor(config) {
    super();

    this.config = config || mainConfig;

    this.converter = new AbstConverter(this.config.deviceInfo.protocol_info);
    // 상위 객체, 외부에서 baseModel을 이용하여 명령 요청
    this.baseModel = new BaseModel.Inverter(this.config.deviceInfo.protocol_info);

    this.model = new Model(this);

    this.observerList = [];
  }

  /**
   * 컨트롤러 ID를 가져올 경우
   * @return {string} Device Controller를 대표하는 ID
   */
  get id() {
    return this.config.deviceInfo.target_id;
  }

  /**
   * DB에 저장할 경우 분류 단위
   * @return {string}
   */
  get category() {
    return this.config.deviceInfo.target_category;
  }

  /** device client 설정 및 프로토콜 바인딩 */
  init() {
    /** 개발 버젼일 경우 Echo Server 구동 */
    if (this.config.hasDev) {
      const echoServer = new EchoServer(this.config.deviceInfo.connect_info.port);
      echoServer.attachDevice(this.config.deviceInfo.protocol_info);
    }
    this.setDeviceClient(this.config.deviceInfo);
    this.converter.setProtocolConverter(this.config.deviceInfo);
  }

  /**
   *
   * @param {Object} parent
   */
  attach(parent) {
    this.observerList.push(parent);
  }

  /**
   * 장치의 현재 데이터 및 에러 내역을 가져옴
   */
  getDeviceOperationInfo() {
    return {
      id: this.config.deviceInfo.target_id,
      config: this.config.deviceInfo,
      data: this.model.deviceData,
      // systemErrorList: [{code: 'new Code2222', msg: '에러 테스트 메시지22', occur_date: new Date() }],
      systemErrorList: this.systemErrorList,
      troubleList: this.model.deviceData.operTroubleList,
      measureDate: new Date(),
    };
  }

  /**
   *
   * @param {commandInfo[]} commandInfoList
   */
  orderOperation(commandInfoList) {
    BU.CLI(commandInfoList);
    try {
      const commandSet = this.generationManualCommand({
        cmdList: commandInfoList,
        commandId: this.id,
      });

      // BU.CLIN(commandSet);

      this.executeCommand(commandSet);
    } catch (error) {
      throw error;
    }
  }

  /**
   * @override
   * Device Controller 변화가 생겨 관련된 전체 Commander에게 뿌리는 Event
   * @param {dcEvent} dcEvent
   * @example 보통 장치 연결, 해제에서 발생
   * dcConnect --> 장치 연결,
   * dcDisconnect --> 장치 연결 해제
   */
  updatedDcEventOnDevice(dcEvent) {
    super.updatedDcEventOnDevice(dcEvent);
    // Observer가 해당 메소드를 가지고 있다면 전송
    _.forEach(this.observerList, observer => {
      if (_.get(observer, 'notifyDeviceEvent')) {
        observer.notifyDeviceEvent(this, dcEvent);
      }
    });
  }

  /**
   * @override
   * 장치에서 명령을 수행하는 과정에서 생기는 1:1 이벤트
   * @param {dcError} dcError 현재 장비에서 실행되고 있는 명령 객체
   */
  onDcError(dcError) {
    super.onDcError(dcError);

    // Error가 발생하면 추적 중인 데이터는 폐기 (config.deviceInfo.protocol_info.protocolOptionInfo.hasTrackingData = true 일 경우 추적하기 때문에 Data를 계속 적재하는 것을 방지함)
    this.converter.resetTrackingDataBuffer();
    this.requestTakeAction(this.definedCommanderResponse.NEXT);
    // Observer가 해당 메소드를 가지고 있다면 전송
    _.forEach(this.observerList, observer => {
      if (_.get(observer, 'notifyDeviceError')) {
        observer.notifyDeviceError(this, dcError);
      }
    });
  }

  /**
   * @override
   * 메시지 발생 핸들러
   * @param {dcMessage} dcMessage
   */
  onDcMessage(dcMessage) {
    // Observer가 해당 메소드를 가지고 있다면 전송
    this.observerList.forEach(observer => {
      if (_.get(observer, 'notifyDeviceMessage')) {
        observer.notifyDeviceMessage(this, dcMessage);
      }
    });
  }

  /**
   * 장치로부터 데이터 수신
   * @override
   * @param {dcData} dcData 현재 장비에서 실행되고 있는 명령 객체
   */
  onDcData(dcData) {
    try {
      BU.CLI('data', dcData.data.toString());
      const parsedData = this.converter.parsingUpdateData(dcData);

      // BU.CLI(parsedData);
      // 만약 파싱 에러가 발생한다면 명령 재 요청
      if (parsedData.eventCode === this.definedCommanderResponse.ERROR) {
        BU.errorLog('inverter', 'parsingError', parsedData);
        // return this.requestTakeAction(this.definedCommanderResponse.RETRY);
        return this.requestTakeAction(this.definedCommanderResponse.RETRY);
      }

      if (parsedData.eventCode === this.definedCommanderResponse.DONE) {
        this.model.onData(parsedData.data);
      }

      // Device Client로 해당 이벤트 Code를 보냄
      BU.CLIN(this.getDeviceOperationInfo().data);
      return this.requestTakeAction(parsedData.eventCode);
    } catch (error) {
      BU.CLI(error);
      BU.logFile(error);
      throw error;
    }
  }
}
module.exports = Control;
