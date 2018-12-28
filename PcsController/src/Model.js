const _ = require('lodash');

const { BU, CU } = require('base-util-jh');

// const {BaseModel} = require('device-protocol-converter-jh');
const { BaseModel } = require('../../../device-protocol-converter-jh');

class Model {
  /**
   * @param {PcsController} controller
   */
  constructor(controller) {
    this.controller = controller;
    // this.deviceData = BaseModel.Inverter.BASE_MODEL;
    this.initModel();
  }

  /**
   * Data 초기화
   */
  initModel() {
    this.tempStorage = BaseModel.Inverter.BASE_MODEL;

    this.deviceData = {};
    _.forEach(this.tempStorage, (v, k) => {
      _.set(this.deviceData, k, null);
    });
  }

  /**
   * 현재 장치 데이터를 가져옴. key에 매칭되는...
   * @param {string} key
   */
  getData(key) {
    return _.get(this.deviceData, key);
  }

  /**
   * 장치에 대한 명령을 2번이상 요청할 경우 데이터 갱신 오류가 발생되기 때문에 최종 데이터 합산을 하기 위한 메소드
   * @param {Object} receiveData 일부분의 데이터만 수신되었을 경우
   */
  onPartData(receiveData) {
    // 수신받은 데이터 객체 탐색
    _.forEach(receiveData, (dataList, nodeDefId) => {
      const data = _.head(dataList);
      // Data가 null or undefined인 경우 할당하지 않음
      if (!_.isNil(data)) {
        // 데이터 목록 중 의미있는 데이터가 있다면 기존 데이터에 덮어쓰기 함
        _.set(this.tempStorage, `${nodeDefId}[0]`, data);
      }
    });
  }

  /** 장치에 대한 명령을 완료하고 임시 저장소에 있는 데이터를 반영할 경우 */
  completeOnData() {
    _.forEach(this.tempStorage, (v, k) => {
      const value = _.isNil(_.head(v)) ? null : _.head(v);
      _.set(this.deviceData, k, value);
    });
  }
}

module.exports = Model;
