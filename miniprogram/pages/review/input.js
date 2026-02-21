// pages/review/input.js
Page({
  data: {
    actualOutcome: '',
    // 结果评价: positive(做对了) / negative(做错了) / ''(未选)
    outcomeType: '',
    // 负面复盘字段
    wrongAssumptions: '',
    errorType: '',
    // 正面复盘字段
    rightAssumptions: '',
    successType: '',
    // 共用字段
    influences: {
      emotion: false,
      newInfo: false,
      externalPressure: false,
      resourceChange: false,
      other: false,
    },
    influenceDetails: '',
    canSubmit: false,
    submitting: false,
    // 负面选项
    errorTypes: [
      { key: 'judgment', label: '判断错了', desc: '当时想法就不对' },
      { key: 'execution', label: '执行错了', desc: '想法对但没做好' },
      { key: 'both', label: '都有问题', desc: '判断和执行都有问题' },
    ],
    // 正面选项
    successTypes: [
      { key: 'judgment', label: '判断准确', desc: '看到了别人没看到的' },
      { key: 'execution', label: '执行到位', desc: '想法和落地都做好了' },
      { key: 'both', label: '都做对了', desc: '判断和执行都很出色' },
    ],
    // 负面影响因素
    negativeInfluenceOptions: [
      { key: 'emotion', label: '我的情绪', desc: '焦虑/兴奋/冲动' },
      { key: 'newInfo', label: '中途新信息', desc: '新需求/新情况' },
      { key: 'externalPressure', label: '外部压力', desc: '老板/客户/家人' },
      { key: 'resourceChange', label: '资源变化', desc: '预算/时间/人手' },
      { key: 'other', label: '其他原因', desc: '' },
    ],
    // 正面影响因素
    positiveInfluenceOptions: [
      { key: 'emotion', label: '心态稳定', desc: '冷静/专注/自信' },
      { key: 'newInfo', label: '信息充分', desc: '做了充分调研' },
      { key: 'externalPressure', label: '好的建议', desc: '他人的关键提醒' },
      { key: 'resourceChange', label: '资源充足', desc: '时间/预算/人手到位' },
      { key: 'other', label: '其他原因', desc: '' },
    ],
  },

  onLoad(options) {
    this.decisionId = options.id;
  },

  onActualOutcomeInput(e) {
    this.setData({ actualOutcome: e.detail.value });
    this.checkCanSubmit();
  },

  selectOutcomeType(e) {
    const { key } = e.currentTarget.dataset;
    // 切换时重置下游字段
    this.setData({
      outcomeType: key,
      wrongAssumptions: '',
      rightAssumptions: '',
      errorType: '',
      successType: '',
      influences: {
        emotion: false,
        newInfo: false,
        externalPressure: false,
        resourceChange: false,
        other: false,
      },
      influenceDetails: '',
    });
    this.checkCanSubmit();
  },

  onWrongAssumptionsInput(e) {
    this.setData({ wrongAssumptions: e.detail.value });
    this.checkCanSubmit();
  },

  onRightAssumptionsInput(e) {
    this.setData({ rightAssumptions: e.detail.value });
    this.checkCanSubmit();
  },

  selectErrorType(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({ errorType: key });
    this.checkCanSubmit();
  },

  selectSuccessType(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({ successType: key });
    this.checkCanSubmit();
  },

  toggleInfluence(e) {
    const { key } = e.currentTarget.dataset;
    const path = `influences.${key}`;
    this.setData({ [path]: !this.data.influences[key] });
    this.checkCanSubmit();
  },

  onInfluenceDetailsInput(e) {
    this.setData({ influenceDetails: e.detail.value });
  },

  checkCanSubmit() {
    const {
      actualOutcome, outcomeType, wrongAssumptions, rightAssumptions,
      errorType, successType, influences,
    } = this.data;

    const hasInfluence = Object.values(influences).some((v) => v);
    const hasOutcome = actualOutcome.trim().length > 0;

    let canSubmit = false;
    if (outcomeType === 'negative') {
      canSubmit = hasOutcome
        && wrongAssumptions.trim().length > 0
        && errorType !== ''
        && hasInfluence;
    } else if (outcomeType === 'positive') {
      canSubmit = hasOutcome
        && rightAssumptions.trim().length > 0
        && successType !== ''
        && hasInfluence;
    }

    this.setData({ canSubmit });
  },

  goBack() {
    wx.navigateBack();
  },

  async submitReview() {
    if (!this.data.canSubmit || this.data.submitting) return;
    this.setData({ submitting: true });

    try {
      const {
        actualOutcome, outcomeType,
        wrongAssumptions, errorType,
        rightAssumptions, successType,
        influences, influenceDetails,
      } = this.data;

      const reviewData = {
        actualOutcome,
        outcomeType,
        influences: { ...influences, details: influenceDetails },
        reviewedAt: Date.now(),
      };

      if (outcomeType === 'negative') {
        reviewData.wrongAssumptions = wrongAssumptions;
        reviewData.errorType = errorType;
      } else {
        reviewData.rightAssumptions = rightAssumptions;
        reviewData.successType = successType;
      }

      const db = wx.cloud.database();
      const _ = db.command;
      await db.collection('decisions').doc(this.decisionId).update({
        data: {
          review: reviewData,
          aiAnalysis: _.remove(),
          feedback: _.remove(),
        },
      });

      wx.redirectTo({
        url: `/pages/review/result?id=${this.decisionId}`,
      });
    } catch (err) {
      console.error('提交复盘失败:', err);
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
