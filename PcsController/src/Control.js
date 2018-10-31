const _ = require('lodash');
const eventToPromise = require('event-to-promise');

const { BU } = require('base-util-jh');

// const AbstDeviceClient = require('device-client-controller-jh');
const AbstDeviceClient = require('../../../device-client-controller-jh');

// const {AbstConverter, BaseModel} = require('device-protocol-converter-jh');
const { AbstConverter, BaseModel } = require('../../../device-protocol-converter-jh');

const Model = require('./Model');

class PcsController extends AbstDeviceClient {
  /** @param {deviceInfo} config */
  constructor(config) {
    super();

    this.config = config;
    /** @type {deviceInfo} Controller 객체의 생성 정보를 담고 있는 설정 정보 */
    this.deviceInfo = this.config;
    /** @type {connect_info} DCC를 생성하기 위한 설정 정보 */
    this.connectInfo = this.deviceInfo.connect_info;
    /** @type {protocol_info} DPC를 생성하기 위한 설정 정보  */
    this.protocolInfo = this.deviceInfo.protocol_info;

    this.converter = new AbstConverter(this.protocolInfo);
    // 상위 객체, 외부에서 baseModel을 이용하여 명령 요청
    this.baseModel = new BaseModel.Inverter(this.protocolInfo);

    this.model = new Model(this);

    this.observerList = [];

    /** PCS와 연결되어있는지 여부 */
    // this.hasConnectedPCS = false;
  }

  /**
   * 컨트롤러 ID를 가져올 경우
   * @return {string} Device Controller를 대표하는 ID
   */
  get id() {
    return this.deviceInfo.target_id;
  }

  /**
   * DB에 저장할 경우 분류 단위
   * @return {string}
   */
  get category() {
    return this.deviceInfo.target_category;
  }

  /**
   * device client 설정 및 프로토콜 바인딩
   * @param {string=} siteUUID 장치가 연결된 지점을 특정지을 or 개소, setPassiveClient에 사용
   * @return {Promise.<PcsController>} 생성된 현 객체 반환
   */
  async init(siteUUID) {
    try {
      const { CONNECT, DISCONNECT } = this.definedControlEvent;
      // 프로토콜 컨버터 바인딩
      this.converter.setProtocolConverter();

      // DCC 초기화 시작
      // connectInfo가 없거나 수동 Client를 사용할 경우
      if (_.isEmpty(this.connectInfo) || this.connectInfo.hasPassive) {
        // 장치 접속 경로가 존재하지 않을 경우 수동 클라이언트 설정
        if (_.isString(siteUUID)) {
          // 해당 사이트 고유 ID
          this.siteUUID = siteUUID;
          this.setPassiveClient(this.deviceInfo, siteUUID);
          return this;
        }
        throw new ReferenceError('Initialization failed.');
      }

      // 접속 경로가 존재시 선언 및 자동 접속을 수행
      this.setDeviceClient(this.deviceInfo);

      // 만약 장치가 접속된 상태라면
      if (this.hasConnectedDevice) {
        return this;
      }

      // 장치 접속 결과를 기다림
      await eventToPromise.multi(this, [CONNECT], [DISCONNECT]);
      // Controller 반환
      return this;
    } catch (error) {
      // 초기화에 실패할 경우에는 에러 처리
      if (error instanceof ReferenceError) {
        throw error;
      }
      // 일반적인 오류일 경우에는 현재 객체 반환 Controller 반환
      return this;
    }
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
      id: this.id,
      config: this.deviceInfo,
      data: this.model.deviceData,
      // systemErrorList: [{code: 'new Code2222', msg: '에러 테스트 메시지22', occur_date: new Date() }],
      systemErrorList: this.systemErrorList,
      troubleList: this.model.deviceData.operTroubleList,
      measureDate: new Date(),
    };
  }

  /**
   * PCS에 명령 수행 요청
   * @param {generationInfo} generationInfo
   * @return {commandSet} 고유 명령 집합
   */
  orderOperation(generationInfo) {
    if (process.env.LOG_PC_ORDER === '1') {
      BU.CLI(`generationInfo Id: ${this.id}`, generationInfo);
    }

    this.model.initModel();
    try {
      if (!this.hasConnectedDevice) {
        throw new Error(`The device has been disconnected. ${_.get(this.connectInfo, 'port')}`);
      }

      const cmdList = this.converter.generationCommand(generationInfo);

      // 생성된 고유 명령 집합
      const commandSet = this.generationManualCommand({
        cmdList,
        commandId: this.id,
      });

      // if (process.env.LOG_PC_ORDER === '1') {
      //   BU.CLIN(commandSet);
      // }

      // 장치 매니저에 명령 실행 요청
      this.executeCommand(commandSet);

      return commandSet;
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
    if (process.env.LOG_PC_EVENT === '1') {
      super.updatedDcEventOnDevice(dcEvent);
    }

    const { CONNECT, DISCONNECT } = this.definedControlEvent;

    switch (dcEvent.eventName) {
      case CONNECT:
        this.emit(CONNECT);
        break;
      case DISCONNECT:
        this.emit(DISCONNECT);
        break;
      default:
        break;
    }

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
    if (process.env.LOG_PC_ERROR === '1') {
      super.onDcError(dcError);
    }

    const { NEXT } = this.definedCommanderResponse;

    // Error가 발생하면 추적 중인 데이터는 폐기 (config.deviceInfo.protocol_info.protocolOptionInfo.hasTrackingData = true 일 경우 추적하기 때문에 Data를 계속 적재하는 것을 방지함)
    this.converter.resetTrackingDataBuffer();
    this.requestTakeAction(NEXT);
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
    if (process.env.LOG_PC_ON_DATA === '1') {
      super.onDcData(dcData);
    }
    try {
      const { DONE, ERROR, WAIT } = this.definedCommanderResponse;
      const { eventCode, data } = this.converter.parsingUpdateData(dcData);

      if (process.env.LOG_PC_ON_DATA === '1') {
        BU.CLI(data);
      }
      // Retry 시도 시 다중 명령 요청 및 수신이 이루어 지므로 Retry 하지 않음.
      if (eventCode === ERROR) {
        BU.errorLog('inverter', 'parsingError', eventCode);
        return this.requestTakeAction(WAIT);
      }

      if (eventCode === DONE) {
        this.model.onData(data);
      }

      return this.requestTakeAction(eventCode);
    } catch (error) {
      BU.logFile(error);
      throw error;
    }
  }
}
module.exports = PcsController;
