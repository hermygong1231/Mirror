// pages/create/step2.js
Page({
  data: {
    reasoning: '',
    concerns: '',
    emotion: '',
    emotionNote: '',
    canSubmit: false,
    chosenOption: '',
    emotions: [
      { key: 'anxious', emoji: '😰', label: '焦虑' },
      { key: 'excited', emoji: '😊', label: '兴奋' },
      { key: 'calm', emoji: '😐', label: '冷静' },
      { key: 'urgent', emoji: '😤', label: '急迫' },
      { key: 'confused', emoji: '😕', label: '纠结' },
    ],
  },

  onLoad() {
    const step1 = wx.getStorageSync('draft_step1');
    if (step1) {
      this.setData({ chosenOption: step1.chosenOption || '' });
    }
    this.loadDraft();
  },

  onUnload() {
    this.saveDraft();
  },

  onReasoningInput(e) {
    this.setData({ reasoning: e.detail.value });
    this.checkCanSubmit();
  },

  onConcernsInput(e) {
    this.setData({ concerns: e.detail.value });
    this.checkCanSubmit();
  },

  selectEmotion(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({ emotion: key });
    this.checkCanSubmit();
  },

  onEmotionNoteInput(e) {
    this.setData({ emotionNote: e.detail.value });
  },

  checkCanSubmit() {
    const { reasoning, concerns, emotion } = this.data;
    const canSubmit =
      reasoning.trim().length > 0 &&
      concerns.trim().length > 0 &&
      emotion !== '';
    this.setData({ canSubmit });
  },

  goBack() {
    wx.navigateBack();
  },

  goNext() {
    if (!this.data.canSubmit) return;
    const { reasoning, concerns, emotion, emotionNote } = this.data;
    const step2Data = {
      reasoning,
      concerns,
      emotion: { primary: emotion, note: emotionNote },
    };
    wx.setStorageSync('draft_step2', step2Data);
    wx.navigateTo({ url: '/pages/create/step3' });
  },

  saveDraft() {
    const { reasoning, concerns, emotion, emotionNote } = this.data;
    wx.setStorageSync('draft_step2_form', {
      reasoning,
      concerns,
      emotion,
      emotionNote,
    });
  },

  loadDraft() {
    const draft = wx.getStorageSync('draft_step2_form');
    if (draft) {
      this.setData({
        reasoning: draft.reasoning || '',
        concerns: draft.concerns || '',
        emotion: draft.emotion || '',
        emotionNote: draft.emotionNote || '',
      });
      this.checkCanSubmit();
    }
  },
});
