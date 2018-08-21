const _ = require('lodash');

const { BU } = require('base-util-jh');
const AbstDeviceClientModel = require('../../device-client-model-jh');
const Control = require('./Control');

const powerFormat = require('../config/powerFormat');

const PcsController = require('../PcsController');

class Model {
  /**
   *
   * @param {Control} controller
   */
  constructor(controller) {
    this.deviceClientModel = new AbstDeviceClientModel(powerFormat);

    this.controller = controller;

    this.systemErrorList = [];
    this.troubleList = [];

    this.init();
  }

  init() {
    // super.hasSaveToDB = true;

    this.controller.config.deviceControllerList.forEach(deviceControllerInfo => {
      this.deviceClientModel.setDevice(deviceControllerInfo.deviceInfo, {
        idKey: 'target_id',
        deviceCategoryKey: 'target_category',
      });
    });

    this.deviceClientModel.setDbConnector(this.controller.config.dbInfo);
  }

  /**
   * @param {DeviceController} deviceController
   */
  onDeviceData(deviceController) {
    // BU.CLI('onInverterData');
    // 인버터 컨트롤러의 동작 상태 정보를 가져옴
    const deviceOperationInfo = deviceController.getDeviceOperationInfo();
    // BU.CLIN(deviceOperationInfo);
    // 모델에 데이터 갱신
    const dataStorageContainer = this.deviceClientModel.onDeviceOperationInfo(
      deviceOperationInfo,
      deviceController.config.deviceInfo.target_category
    );

    // BU.CLIN(dataStorageContainer, 4);
  }

  /**
   * DB에 집어 넣을 수 있도록 데이터를 정제함.
   * 장치 데이터는 InsertDataList에 기입
   * 에러 데이터는 DB에 저장되어 있는 현재 에러와 비교 후 InsertTroubleList, UpdateTroubleList로 각각 계산 후 기입
   * 정제 테이블을 기초로 계산하며 DB 업데이트가 완료되면 Storage의 데이터는 초기화 됨.
   * @param {Date} measureDate Update 가 된 시각
   * @param {string} category Update 처리 할 카테고리
   */
  async updateDeviceCategory(measureDate, category) {
    try {
      // Storage에 저장되어 있는 데이터(장치 데이터,)
      BU.CLI('updateDeviceCategory');
      const convertDataList = await this.deviceClientModel.refineTheDataToSaveDB(
        category,
        measureDate
      );
      BU.CLIN(convertDataList, 2);

      const resultSaveToDB = await this.deviceClientModel.saveDataToDB(category);
      BU.CLIN(resultSaveToDB);

      return true;
    } catch (error) {
      BU.CLI(error);
      BU.errorLog('updateDeviceCategory', _.get(error, 'message'), error);
    }
  }
}

module.exports = Model;
