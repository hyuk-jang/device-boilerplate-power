const _ = require('lodash');

const {BU} = require('base-util-jh');

const powerFormat = require('../config/powerFormat');
const AbstDeviceClientModel = require('../../device-client-model-jh');

class Model {
  /**
   *
   * @param {PowerController} controller
   */
  constructor(controller) {
    this.deviceClientModel = new AbstDeviceClientModel(powerFormat);

    this.deviceCommandContainerList = controller.deviceCommandContainerList;

    this.controller = controller;

    this.systemErrorList = [];
    this.troubleList = [];

    this.init();
  }

  /** DeviceClientModel을 사용하기 위해 Device Controller List를 순회하면서 초기화  */
  init() {
    this.deviceClientModel.setHasSaveToDB(true);

    // Device Controller 목록 만큼 순회하면서 DCM 객체를 생성
    this.controller.config.deviceControllerList.forEach(deviceControllerInfo => {
      // DCM 에서 관리할 Category와 Storage ID 를 설정
      this.deviceClientModel.setDevice(deviceControllerInfo.deviceInfo, {
        idKey: 'target_id',
        deviceCategoryKey: 'target_category',
      });
    });
    // 자동으로 DB에 입력할 DB 커넥션 객체 설정
    this.deviceClientModel.setDbConnector(this.controller.config.dbInfo);
  }

  /**
   * Device Controller에서 명령 수행을 완료했을 경우 DCM에 적용하고 모두 완료할 경우에는 DB에 적용 및 명령 수행 중인 목록에서 제거
   * @param {PcsController} pcsController PCS Controller 객체
   * @param {dcMessage} dcMessage 명령 수행 결과 데이터
   */
  completedDeviceCommand(pcsController, dcMessage) {
    BU.CLI('completedDeviceCommand');
    // 조건을 만족할 경우 순회를 중지하기 위함
    let hasFind = false;
    // 생성된 명령 목록에서 해당 commandSet 일치 객체 추출
    _.forEach(this.deviceCommandContainerList, deviceCommandContainerInfo => {
      if (hasFind) return false;
      // 명령 목록 순회
      _.forEach(deviceCommandContainerInfo.deviceCommandList, deviceCommandEleInfo => {
        // commandSet 일치 여부 판단
        if (_.isEqual(deviceCommandEleInfo.commandSet, dcMessage.commandSet)) {
          const {category} = deviceCommandEleInfo;
          hasFind = true;

          // 이미 완료된 목록이 재차 요청된 거라면 무시(시스템 오류 예방)
          if (deviceCommandEleInfo.hasComplete) return false;

          BU.CLI('commandId', dcMessage.commandSet.commandId);
          // 완료된 목록으로 처리
          deviceCommandEleInfo.hasComplete = true;

          // 데이터가 갱신되었다고 알림
          this.deviceClientModel.onDeviceOperationInfo(
            pcsController.getDeviceOperationInfo(),
            category,
          );

          // 해당 카테고리 모든 명령 수행 여부 확인
          const hasAllCompleted = _.every(deviceCommandContainerInfo.deviceCommandList, {
            hasComplete: true,
          });

          // 모든 명령을 수행할 경우에 업데이트 수행
          if (hasAllCompleted) {
            this.endDeviceCommand(deviceCommandContainerInfo);
          }
        }
      });
    });
  }

  /**
   * 명령의 수행이 모두 완료되었다면 목록에서 제거하고 DB에 반영
   * @param {deviceCommandContainerInfo} deviceCommandContainerInfo
   */
  endDeviceCommand(deviceCommandContainerInfo) {
    BU.CLI('endDeviceCommand');
    const foundIndex = _.findIndex(this.deviceCommandContainerList, ele =>
      _.isEqual(ele, deviceCommandContainerInfo),
    );
    // 타이머를 해제
    deviceCommandContainerInfo.timeoutTimer.pause();

    // 해당 명령이 존재한다면
    if (foundIndex > -1) {
      // 타임아웃 타이머 해제
      // 목록에서 삭제
      _.pullAt(this.deviceCommandContainerList, foundIndex);

      // 정의된 category DB 반영 요청
      _(deviceCommandContainerInfo.deviceCommandList)
        .map('category')
        .unionBy()
        .value()
        .forEach(categoryValue =>
          this.updateDeviceCategory(deviceCommandContainerInfo.momentDate, categoryValue).catch(
            err => BU.CLI(err),
          ),
        );
    }
  }

  /**
   * DB에 집어 넣을 수 있도록 데이터를 정제함.
   * 장치 데이터는 InsertDataList에 기입
   * 에러 데이터는 DB에 저장되어 있는 현재 에러와 비교 후 InsertTroubleList, UpdateTroubleList로 각각 계산 후 기입
   * 정제 테이블을 기초로 계산하며 DB 업데이트가 완료되면 Storage의 데이터는 초기화 됨.
   * @param {Moment} momentDate Update 가 된 시각
   * @param {string} category Update 처리 할 카테고리
   */
  async updateDeviceCategory(momentDate, category) {
    BU.CLIS(category, momentDate);
    try {
      // Storage에 저장되어 있는 데이터(장치 데이터,)
      BU.CLI('updateDeviceCategory');
      const convertDataList = await this.deviceClientModel.refineTheDataToSaveDB(
        category,
        momentDate.toDate(),
      );
      BU.CLIN(convertDataList, 3);

      const resultSaveToDB = await this.deviceClientModel.saveDataToDB(category);
      BU.CLIN(resultSaveToDB);

      return true;
    } catch (error) {
      // BU.CLI(error);
      BU.errorLog('updateDeviceCategory', _.get(error, 'message'), error);
    }
  }
}

module.exports = Model;

/**
 * @typedef {Object} deviceCommandContainerInfo
 * @property {Moment} momentDate 명령 요청 시각
 * @property {Timer} timeoutTimer 정해진 시간안에 해당 명령의 응답 대기 인터벌.
 * @property {deviceCommandEleInfo[]} deviceCommandList 명령에 관련된 세부 사항
 */

/**
 * @typedef {Object} deviceCommandEleInfo 명령 세부 사항
 * @property {string} category 장치 컨트롤러 카테고리
 * @property {boolean} hasComplete 명령 완료 여부
 * @property {commandSet} commandSet 생성된 명령 고유 객체
 */
