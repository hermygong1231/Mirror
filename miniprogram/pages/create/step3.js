// pages/create/step3.js
Page({
  data: {
    expectations: '',
    reviewPeriod: '',
    reviewDateText: '',
    canSubmit: false,
    submitting: false,
    showSuccess: false,
    periods: [
      { key: '1week', label: '1周' },
      { key: '1month', label: '1月' },
      { key: '3months', label: '3月' },
      { key: '6months', label: '6月' },
    ],
  },

  onLoad() {
    this.loadDraft();
  },

  onUnload() {
    this.saveDraft();
  },

  onExpectationsInput(e) {
    this.setData({ expectations: e.detail.value });
    this.checkCanSubmit();
  },

  selectPeriod(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({ reviewPeriod: key });
    this.calcReviewDate(key);
    this.checkCanSubmit();
  },

  calcReviewDate(period) {
    const now = new Date();
    let target;
    switch (period) {
      case '1week':
        target = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case '1month':
        target = new Date(now);
        target.setMonth(target.getMonth() + 1);
        break;
      case '3months':
        target = new Date(now);
        target.setMonth(target.getMonth() + 3);
        break;
      case '6months':
        target = new Date(now);
        target.setMonth(target.getMonth() + 6);
        break;
      default:
        target = now;
    }
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    this.setData({ reviewDateText: `${y}年${m}月${d}日` });
  },

  checkCanSubmit() {
    const { expectations, reviewPeriod } = this.data;
    this.setData({
      canSubmit: expectations.trim().length > 0 && reviewPeriod !== '',
    });
  },

  goBack() {
    wx.navigateBack();
  },

  async submitDecision() {
    if (this.data.submitting || this.data.showSuccess) return;

    // 实时从 data 校验 step3 字段
    const { expectations, reviewPeriod } = this.data;
    if (!expectations.trim() || !reviewPeriod) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    // 校验 step1/step2 核心数据是否存在
    const step1 = wx.getStorageSync('draft_step1') || {};
    const step2 = wx.getStorageSync('draft_step2') || {};
    if (!step1.decision || !step1.decision.trim()) {
      wx.showToast({ title: '决策内容丢失，请返回重新填写', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      // 计算复盘日期时间戳
      const reviewDate = this.getReviewTimestamp(reviewPeriod);

      // 如果用户指定了决策日期，用该日期作为 createdAt
      let createdAt = Date.now();
      if (step1.decisionDate) {
        const parsed = new Date(step1.decisionDate + 'T12:00:00');
        if (!isNaN(parsed.getTime())) {
          createdAt = parsed.getTime();
        }
      }

      const decisionData = {
        decision: step1.decision || '',
        options: step1.options || [],
        chosenOption: step1.chosenOption || '',
        tags: step1.tags || {},
        reasoning: step2.reasoning || '',
        concerns: step2.concerns || '',
        emotion: step2.emotion || {},
        expectations,
        reviewPeriod,
        reviewDate,
        createdAt,
      };

      const db = wx.cloud.database();
      const addPromise = db.collection('decisions').add({ data: decisionData });
      const timeoutPromise = new Promise((__, reject) => {
        setTimeout(() => reject(new Error('提交超时')), 15000);
      });
      await Promise.race([addPromise, timeoutPromise]);

      // 清除草稿
      wx.removeStorageSync('draft_step1');
      wx.removeStorageSync('draft_step2');
      wx.removeStorageSync('draft_step1_form');
      wx.removeStorageSync('draft_step2_form');
      wx.removeStorageSync('draft_step3_form');

      // 首次提交：展示引导页；老用户：toast + 跳列表
      const isFirstSubmit = !wx.getStorageSync('onboarding_submitted');
      if (isFirstSubmit) {
        wx.setStorageSync('onboarding_submitted', true);
        this.setData({ showSuccess: true });
      } else {
        wx.showToast({ title: '记录成功', icon: 'success' });
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/decisions/list' });
        }, 1500);
      }
    } catch (err) {
      console.error('提交决策失败:', err);
      const msg = err && err.message === '提交超时'
        ? '网络超时，请检查网络后重试'
        : '提交失败，请重试';
      wx.showToast({ title: msg, icon: 'none' });
      this.setData({ submitting: false });
    }
  },

  goToList() {
    wx.reLaunch({ url: '/pages/decisions/list' });
  },

  goToReviewSample() {
    // 找到示例决策，直接跳去复盘
    const db = wx.cloud.database();
    db.collection('decisions')
      .where({ _isSample: true })
      .limit(1)
      .get()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const sampleId = res.data[0]._id;
          wx.reLaunch({ url: `/pages/review/recall?id=${sampleId}` });
        } else {
          wx.reLaunch({ url: '/pages/decisions/list' });
        }
      })
      .catch(() => {
        wx.reLaunch({ url: '/pages/decisions/list' });
      });
  },

  getReviewTimestamp(period) {
    const now = new Date();
    switch (period) {
      case '1week':
        return now.getTime() + 7 * 24 * 60 * 60 * 1000;
      case '1month':
        now.setMonth(now.getMonth() + 1);
        return now.getTime();
      case '3months':
        now.setMonth(now.getMonth() + 3);
        return now.getTime();
      case '6months':
        now.setMonth(now.getMonth() + 6);
        return now.getTime();
      default:
        now.setMonth(now.getMonth() + 3);
        return now.getTime();
    }
  },

  saveDraft() {
    const { expectations, reviewPeriod } = this.data;
    wx.setStorageSync('draft_step3_form', { expectations, reviewPeriod });
  },

  loadDraft() {
    const draft = wx.getStorageSync('draft_step3_form');
    if (draft) {
      this.setData({
        expectations: draft.expectations || '',
        reviewPeriod: draft.reviewPeriod || '',
      });
      if (draft.reviewPeriod) this.calcReviewDate(draft.reviewPeriod);
      this.checkCanSubmit();
    }
  },
});
