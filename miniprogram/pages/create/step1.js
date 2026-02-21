// pages/create/step1.js
Page({
  data: {
    decision: '',
    options: [
      { id: 1, text: '' },
      { id: 2, text: '' },
    ],
    chosenOptionId: null,
    nextOptionId: 3,
    canSubmit: false,
    // 决策日期
    decisionDate: '',
    decisionDateDisplay: '',
    maxDate: '',
    // AI标签
    tags: {
      category: '',
      riskLevel: '',
      reversibility: '',
      aiGenerated: false,
    },
    tagLoading: false,
    tagsVisible: false,
    // 标签显示值（wxml不支持indexOf，需在JS中计算）
    categoryIndex: 0,
    riskIndex: 0,
    reversibilityIndex: 0,
    categoryDisplay: '',
    riskDisplay: '',
    reversibilityDisplay: '',
    // 标签选项
    categoryOptions: ['product', 'investment', 'career', 'life'],
    categoryLabels: ['产品', '投资', '工作', '人生'],
    riskOptions: ['low', 'medium', 'high'],
    riskLabels: ['低', '中', '高'],
    reversibilityOptions: ['reversible', 'irreversible'],
    reversibilityLabels: ['可逆', '不可逆'],
  },

  onLoad() {
    // 初始化日期为今天
    const today = this.formatDateStr(new Date());
    this.setData({
      decisionDate: today,
      decisionDateDisplay: this.formatDateDisplay(today),
      maxDate: today,
    });
    this.loadDraft();
  },

  onUnload() {
    this.saveDraft();
  },

  // 决策日期选择
  onDateChange(e) {
    const date = e.detail.value;
    this.setData({
      decisionDate: date,
      decisionDateDisplay: this.formatDateDisplay(date),
    });
  },

  formatDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  formatDateDisplay(dateStr) {
    const [y, m, d] = dateStr.split('-');
    const today = this.formatDateStr(new Date());
    if (dateStr === today) return '今天';
    return `${parseInt(m, 10)}月${parseInt(d, 10)}日`;
  },

  // 决策内容输入
  onDecisionInput(e) {
    this.setData({ decision: e.detail.value });
    this.checkCanSubmit();
    // 防抖触发AI标签分析
    if (this._tagTimer) clearTimeout(this._tagTimer);
    this._tagTimer = setTimeout(() => {
      this.analyzeTagsIfNeeded();
    }, 800);
  },

  // 本地关键词标签分析（无需云函数）
  analyzeTagsIfNeeded() {
    const { decision } = this.data;
    if (!decision || decision.length < 3) return;

    this.setData({ tagLoading: true });

    const text = decision.toLowerCase();
    // 分类识别——关键词尽量覆盖常见场景
    const categoryKeywords = {
      product: [
        '产品', '功能', '需求', '上线', '迭代', '用户体验', '用户',
        'feature', 'mvp', '项目', '开发', '技术', '系统', '工具',
        '平台', '应用', '小程序', '网站', '设计', '方案', '架构',
        '重构', '优化', '模块', '接口', 'api', '知识管理', '做一个',
      ],
      investment: [
        '投资', '基金', '股票', '理财', '买入', '卖出', '收益',
        '亏损', '房产', '买房', '炒股', '加仓', '减仓', '定投',
        '债券', '期货', '比特币', '加密', '资产',
      ],
      career: [
        '工作', '跳槽', '面试', '晋升', '加薪', '离职', '转行',
        '团队', '老板', '公司', '创业', '副业', '兼职', 'offer',
        '绩效', '同事', '部门', '管理', '升职', '裁员',
      ],
      life: [
        '生活', '搬家', '结婚', '旅行', '健康', '学习', '考试',
        '房子', '装修', '宠物', '孩子', '教育', '感情', '分手',
        '运动', '饮食', '习惯', '城市', '回老家',
      ],
    };
    let category = '';
    let maxHits = 0;
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      const hits = keywords.filter((k) => text.includes(k)).length;
      if (hits > maxHits) {
        maxHits = hits;
        category = cat;
      }
    }
    // 兜底：如果没匹配到任何分类，默认为 life
    if (!category) category = 'life';

    // 风险等级
    const highRiskWords = ['不可逆', '巨大', '严重', '风险很大', '赌', '全部', '所有', '押注', '重大'];
    const lowRiskWords = ['小', '试试', '测试', '尝试', '低风险', '简单', '轻松'];
    let riskLevel = 'medium';
    if (highRiskWords.some((w) => text.includes(w))) riskLevel = 'high';
    else if (lowRiskWords.some((w) => text.includes(w))) riskLevel = 'low';

    // 可逆性
    const irreversibleWords = ['不可逆', '无法撤回', '永久', '不能回头', '辞职', '离职', '分手', '卖掉'];
    const reversibility = irreversibleWords.some((w) => text.includes(w))
      ? 'irreversible'
      : 'reversible';

    this.setData({
      tags: { category, riskLevel, reversibility, aiGenerated: true },
      tagLoading: false,
      tagsVisible: true,
    });
    this.updateTagDisplay();
  },

  // 根据tags值计算索引和显示文本
  updateTagDisplay() {
    const { tags, categoryOptions, categoryLabels, riskOptions, riskLabels, reversibilityOptions, reversibilityLabels } = this.data;
    const ci = categoryOptions.indexOf(tags.category);
    const ri = riskOptions.indexOf(tags.riskLevel);
    const vi = reversibilityOptions.indexOf(tags.reversibility);
    this.setData({
      categoryIndex: ci >= 0 ? ci : 0,
      riskIndex: ri >= 0 ? ri : 0,
      reversibilityIndex: vi >= 0 ? vi : 0,
      categoryDisplay: ci >= 0 ? categoryLabels[ci] : '',
      riskDisplay: ri >= 0 ? riskLabels[ri] : '',
      reversibilityDisplay: vi >= 0 ? reversibilityLabels[vi] : '',
    });
  },

  // 手动展开标签
  expandTags() {
    this.setData({ tagsVisible: true });
  },

  // 收起标签
  collapseTags() {
    this.setData({ tagsVisible: false });
  },

  // 选项输入
  onOptionInput(e) {
    const { id } = e.currentTarget.dataset;
    const { options } = this.data;
    const idx = options.findIndex((o) => o.id === id);
    if (idx !== -1) {
      options[idx].text = e.detail.value;
      this.setData({ options });
      this.checkCanSubmit();
    }
  },

  // 添加选项
  addOption() {
    const { options, nextOptionId } = this.data;
    if (options.length >= 5) {
      wx.showToast({ title: '最多5个选项', icon: 'none' });
      return;
    }
    options.push({ id: nextOptionId, text: '' });
    this.setData({ options, nextOptionId: nextOptionId + 1 });
  },

  // 删除选项
  removeOption(e) {
    const { id } = e.currentTarget.dataset;
    let { options, chosenOptionId } = this.data;
    if (options.length <= 1) return;
    options = options.filter((o) => o.id !== id);
    if (chosenOptionId === id) chosenOptionId = null;
    this.setData({ options, chosenOptionId });
    this.checkCanSubmit();
  },

  // 选择倾向
  chooseOption(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ chosenOptionId: id });
    this.checkCanSubmit();
  },

  // 标签选择
  onCategoryChange(e) {
    this.setData({
      'tags.category': this.data.categoryOptions[e.detail.value],
      'tags.aiGenerated': false,
    });
    this.updateTagDisplay();
  },

  onRiskChange(e) {
    this.setData({
      'tags.riskLevel': this.data.riskOptions[e.detail.value],
      'tags.aiGenerated': false,
    });
    this.updateTagDisplay();
  },

  onReversibilityChange(e) {
    this.setData({
      'tags.reversibility': this.data.reversibilityOptions[e.detail.value],
      'tags.aiGenerated': false,
    });
    this.updateTagDisplay();
  },

  // 校验
  checkCanSubmit() {
    const { decision, options, chosenOptionId } = this.data;
    const hasDecision = decision.trim().length > 0;
    const hasOption = options.some((o) => o.text.trim().length > 0);
    const hasChosen = chosenOptionId !== null;
    this.setData({ canSubmit: hasDecision && hasOption && hasChosen });
  },

  // 下一步
  goNext() {
    if (!this.data.canSubmit) return;
    const { decision, options, chosenOptionId, tags, decisionDate } = this.data;
    const chosen = options.find((o) => o.id === chosenOptionId);

    // 存到缓存供后续页面使用
    const step1Data = {
      decision,
      options: options.filter((o) => o.text.trim()).map((o) => o.text),
      chosenOption: chosen ? chosen.text : '',
      tags,
      decisionDate,
    };
    wx.setStorageSync('draft_step1', step1Data);
    wx.navigateTo({ url: '/pages/create/step2' });
  },

  // 草稿保存/加载
  saveDraft() {
    const { decision, options, chosenOptionId, tags, decisionDate } = this.data;
    wx.setStorageSync('draft_step1_form', {
      decision,
      options,
      chosenOptionId,
      tags,
      decisionDate,
    });
  },

  loadDraft() {
    const draft = wx.getStorageSync('draft_step1_form');
    if (draft) {
      const tags = draft.tags || this.data.tags;
      const tagsVisible = !!(tags.category || tags.riskLevel || tags.reversibility);
      const updates = {
        decision: draft.decision || '',
        options: draft.options || [{ id: 1, text: '' }, { id: 2, text: '' }],
        chosenOptionId: draft.chosenOptionId || null,
        tags,
        tagsVisible,
      };
      if (draft.decisionDate) {
        updates.decisionDate = draft.decisionDate;
        updates.decisionDateDisplay = this.formatDateDisplay(draft.decisionDate);
      }
      this.setData(updates);
      this.checkCanSubmit();
      this.updateTagDisplay();
    }
  },
});
