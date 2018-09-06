const _ = require('lodash');

const {BU, CU} = require('base-util-jh');

// const {BaseModel} = require('device-protocol-converter-jh');
const {BaseModel} = require('../../../device-protocol-converter-jh');

class Model {
  /**
   * @param {PcsController} controller
   */
  constructor(controller) {
    this.controller = controller;
    this.deviceData = BaseModel.Inverter.BASE_MODEL;
  }

  /**
   * 현재 장치 데이터를 가져옴. key에 매칭되는...
   * @param {string} key
   */
  getData(key) {
    return _.get(this.deviceData, key);
  }

  /**
   * @param {Object} receiveData
   */
  onData(receiveData) {
    // BU.CLI(salternData);
    _.forEach(receiveData, (data, key) => {
      // Data의 Key가 없거나 Data가 null인 경우 할당하지 않음
      if (_.has(this.deviceData, key) && data !== null) {
        this.deviceData[key] = data;
      }
    });
    // BU.CLI(this.controller.id, this.deviceData);
  }
}

module.exports = Model;
