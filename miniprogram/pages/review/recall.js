// pages/review/recall.js
const emotionMap = {
  anxious: { emoji: '😰', label: '焦虑' },
  excited: { emoji: '😊', label: '兴奋' },
  calm: { emoji: '😐', label: '冷静' },
  urgent: { emoji: '😤', label: '急迫' },
  confused: { emoji: '😕', label: '纠结' },
};

Page({
  data: {
    decision: null,
    loading: true,
    emotionEmoji: '',
    emotionLabel: '',
    createdDateStr: '',
    timePassed: '',
  },

  onLoad(options) {
    this.decisionId = options.id;
    this.loadDecision();
  },

  async loadDecision() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('decisions').doc(this.decisionId).get();

      const decision = res.data;
      if (!decision) {
        wx.showToast({ title: '决策不存在', icon: 'none' });
        return;
      }

      const emotion = emotionMap[decision.emotion?.primary] || {};
      const createdDate = new Date(decision.createdAt);
      const now = new Date();
      const diffDays = Math.floor(
        (now - createdDate) / (1000 * 60 * 60 * 24)
      );
      let timePassed = '';
      if (diffDays < 7) {
        timePassed = `${diffDays}天前`;
      } else if (diffDays < 30) {
        timePassed = `${Math.floor(diffDays / 7)}周前`;
      } else {
        timePassed = `${Math.floor(diffDays / 30)}个月前`;
      }

      const m = createdDate.getMonth() + 1;
      const d = createdDate.getDate();

      this.setData({
        decision,
        loading: false,
        emotionEmoji: emotion.emoji || '',
        emotionLabel: emotion.label || '',
        createdDateStr: `${createdDate.getFullYear()}年${m}月${d}日`,
        timePassed,
      });
    } catch (err) {
      console.error('加载决策失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  goReview() {
    wx.navigateTo({
      url: `/pages/review/input?id=${this.decisionId}`,
    });
  },

  goBack() {
    wx.navigateBack();
  },
});
