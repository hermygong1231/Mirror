// pages/decisions/list.js
const emotionMap = {
  anxious: { emoji: '😰', label: '焦虑' },
  excited: { emoji: '😊', label: '兴奋' },
  calm: { emoji: '😐', label: '冷静' },
  urgent: { emoji: '😤', label: '急迫' },
  confused: { emoji: '😕', label: '纠结' },
};

const categoryMap = {
  product: '产品',
  investment: '投资',
  career: '工作',
  life: '人生',
};

Page({
  data: {
    decisions: [],
    loading: true,
    hasMore: false,
    page: 0,
    pageSize: 20,
    activeTab: 'all', // all / pending / reviewed
    searchKeyword: '',
    showSearch: false,
    showSwipeHint: false,
    showEarlyReviewHint: false,
  },

  onShow() {
    // 检查是否需要展示引导
    const showSwipeHint = !wx.getStorageSync('onboarding_swipe_hint_done');
    const showEarlyReviewHint = !wx.getStorageSync('onboarding_early_review_done');
    this.setData({ decisions: [], page: 0, showSwipeHint, showEarlyReviewHint });
    this._allItems = [];
    this.ensureSampleDecision().then(() => {
      this.loadDecisions();
    });
  },

  // 新用户首次进入时，自动插入一条「待复盘」示例决策
  async ensureSampleDecision() {
    if (wx.getStorageSync('onboarding_sample_done')) return;

    try {
      const db = wx.cloud.database();
      // 检查是否已有任何决策
      const { total } = await db.collection('decisions').count();
      if (total > 0) {
        wx.setStorageSync('onboarding_sample_done', true);
        return;
      }

      // 插入示例决策：一个已过复盘日期的历史决策
      const now = Date.now();
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

      await db.collection('decisions').add({
        data: {
          decision: '周末花一整天学新技能，还是好好休息？',
          options: ['学新技能', '休息放松'],
          chosenOption: '学新技能',
          tags: { category: 'life' },
          reasoning: '感觉最近一直在重复同样的事情，想突破一下',
          concerns: '怕周一更累，反而影响工作状态',
          emotion: { primary: 'confused' },
          expectations: '学完后会有成就感，下周工作效率也会提高',
          reviewPeriod: '1week',
          reviewDate: threeDaysAgo,
          createdAt: oneWeekAgo,
          _isSample: true,
        },
      });

      wx.setStorageSync('onboarding_sample_done', true);
    } catch (err) {
      console.error('创建示例决策失败:', err);
    }
  },

  onPullDownRefresh() {
    this.setData({ decisions: [], page: 0 });
    this._allItems = [];
    this.loadDecisions().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.loadDecisions();
    }
  },

  // ---- 左滑手势 ----
  onTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.swiping = false;
    this.directionLocked = false;

    // 记录当前卡片已有的偏移量
    const { id } = e.currentTarget.dataset;
    const item = this.data.decisions.find((d) => d._id === id);
    this.startSwipeX = (item && item.swipeX) || 0;

    // rpx 转 px 比率
    const sysInfo = wx.getWindowInfo();
    this.rpxRatio = sysInfo.windowWidth / 750;
  },

  onTouchMove(e) {
    const dx = e.touches[0].clientX - this.touchStartX;
    const dy = e.touches[0].clientY - this.touchStartY;

    // 首次移动时锁定方向
    if (!this.directionLocked && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      this.directionLocked = true;
      this.swiping = Math.abs(dx) > Math.abs(dy);
    }
    if (!this.swiping) return;

    const { id } = e.currentTarget.dataset;
    const idx = this.data.decisions.findIndex((d) => d._id === id);
    if (idx === -1) return;

    const item = this.data.decisions[idx];
    // 按钮宽度 160rpx，转为 px
    const btnWidthPx = 160 * this.rpxRatio;
    const maxSwipePx = item.isReviewed ? btnWidthPx * 2 : btnWidthPx;
    const newX = Math.max(-maxSwipePx, Math.min(0, this.startSwipeX + dx));

    this.setData({
      [`decisions[${idx}].swipeX`]: newX,
      [`decisions[${idx}].animating`]: false,
    });
  },

  onTouchEnd(e) {
    if (!this.swiping) return;

    const { id } = e.currentTarget.dataset;
    const idx = this.data.decisions.findIndex((d) => d._id === id);
    if (idx === -1) return;

    const item = this.data.decisions[idx];
    const btnWidthPx = 160 * this.rpxRatio;
    const maxSwipePx = item.isReviewed ? btnWidthPx * 2 : btnWidthPx;
    const threshold = maxSwipePx / 3;
    const currentX = item.swipeX || 0;

    const targetX = currentX < -threshold ? -maxSwipePx : 0;
    this.setData({
      [`decisions[${idx}].swipeX`]: targetX,
      [`decisions[${idx}].animating`]: true,
    });
  },

  // 关闭所有滑动
  closeAllSwipe() {
    const updates = {};
    this.data.decisions.forEach((d, i) => {
      if (d.swipeX) {
        updates[`decisions[${i}].swipeX`] = 0;
        updates[`decisions[${i}].animating`] = true;
      }
    });
    if (Object.keys(updates).length) {
      this.setData(updates);
    }
  },

  switchTab(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ activeTab: tab, decisions: [], page: 0 });
    this._allItems = [];
    this.loadDecisions();
  },

  // 关闭左滑引导提示
  dismissSwipeHint() {
    wx.setStorageSync('onboarding_swipe_hint_done', true);
    this.setData({ showSwipeHint: false });
  },

  // 关闭提前复盘引导
  dismissEarlyReviewHint() {
    wx.setStorageSync('onboarding_early_review_done', true);
    this.setData({ showEarlyReviewHint: false });
  },

  // ---- 搜索 ----
  toggleSearch() {
    const show = !this.data.showSearch;
    this.setData({
      showSearch: show,
      searchKeyword: show ? this.data.searchKeyword : '',
    });
    if (!show) {
      this.applyFilter();
    }
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    // 防抖
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.applyFilter();
    }, 300);
  },

  clearSearch() {
    this.setData({ searchKeyword: '' });
    this.applyFilter();
  },

  applyFilter() {
    const { activeTab, searchKeyword } = this.data;
    const keyword = searchKeyword.trim().toLowerCase();
    let list = this._allItems || [];

    // tab 筛选
    if (activeTab === 'pending') {
      list = list.filter((d) => !d.isReviewed);
    } else if (activeTab === 'reviewed') {
      list = list.filter((d) => d.isReviewed);
    }

    // 搜索筛选
    if (keyword) {
      list = list.filter((d) =>
        (d.decision || '').toLowerCase().includes(keyword)
        || (d.chosenOption || '').toLowerCase().includes(keyword)
        || (d.categoryLabel || '').toLowerCase().includes(keyword)
      );
    }

    this.setData({ decisions: list });
  },

  async loadDecisions() {
    this.setData({ loading: true });
    try {
      const db = wx.cloud.database();
      const { page, pageSize } = this.data;

      // 始终查全部数据，前端做 tab 筛选
      const res = await db.collection('decisions')
        .orderBy('createdAt', 'desc')
        .skip(page * pageSize)
        .limit(pageSize)
        .get();

      const now = Date.now();
      const allItems = (res.data || []).map((item) => {
        const emotion = emotionMap[item.emotion?.primary] || {};
        const isReviewed = !!item.review;
        const isOverdue = item.reviewDate && item.reviewDate <= now && !isReviewed;
        const category = categoryMap[item.tags?.category] || '';
        const createdDate = this.formatDate(item.createdAt);
        const reviewDateStr = item.reviewDate
          ? this.formatDate(item.reviewDate)
          : '';

        return {
          ...item,
          emotionEmoji: emotion.emoji || '',
          emotionLabel: emotion.label || '',
          categoryLabel: category,
          createdDate,
          reviewDateStr,
          isOverdue,
          isReviewed,
          isSample: !!item._isSample,
          statusText: isReviewed ? '已复盘' : isOverdue ? '待复盘' : '等待中',
          statusClass: isReviewed
            ? 'status-reviewed'
            : isOverdue
            ? 'status-overdue'
            : 'status-waiting',
        };
      });

      // 累积到 _allItems 中
      this._allItems = [...(this._allItems || []), ...allItems];

      this.setData({
        page: this.data.page + 1,
        hasMore: allItems.length === this.data.pageSize,
        loading: false,
      });

      this.applyFilter();
    } catch (err) {
      console.error('加载决策列表失败:', err);
      this.setData({ loading: false });
    }
  },

  formatDate(ts) {
    const d = new Date(ts);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${m}月${day}日`;
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/create/step1' });
  },

  // ---- 删除决策 ----
  deleteDecision(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条决策吗？',
      confirmColor: '#dc2626',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const db = wx.cloud.database();
          await db.collection('decisions').doc(id).remove();
          // 从列表移除
          const decisions = this.data.decisions.filter((d) => d._id !== id);
          this.setData({ decisions });
          wx.showToast({ title: '已删除', icon: 'success' });
        } catch (err) {
          console.error('删除失败:', err);
          wx.showToast({ title: '删除失败', icon: 'none' });
        }
      },
    });
  },

  // ---- 重写复盘 ----
  rewriteReview(e) {
    const { id } = e.currentTarget.dataset;
    this.closeAllSwipe();
    wx.showModal({
      title: '重写复盘',
      content: '将清除当前的复盘和智能分析，重新填写。',
      confirmColor: '#2563eb',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const db = wx.cloud.database();
          const _ = db.command;
          await db.collection('decisions').doc(id).update({
            data: {
              review: _.remove(),
              aiAnalysis: _.remove(),
              feedback: _.remove(),
            },
          });
          // 跳转到复盘回顾页
          wx.navigateTo({ url: `/pages/review/recall?id=${id}` });
        } catch (err) {
          console.error('重写复盘失败:', err);
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      },
    });
  },

  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.decisions.find((d) => d._id === id);
    if (!item) return;

    // 如果有卡片处于滑开状态，先关闭
    if (item.swipeX && item.swipeX < 0) {
      this.closeAllSwipe();
      return;
    }

    if (item.isOverdue && !item.isReviewed) {
      // 去复盘
      wx.navigateTo({ url: `/pages/review/recall?id=${id}` });
    } else if (item.isReviewed) {
      // 查看结果
      wx.navigateTo({ url: `/pages/review/result?id=${id}` });
    } else {
      // 查看详情(暂跳复盘回顾页)
      wx.navigateTo({ url: `/pages/review/recall?id=${id}` });
    }
  },

  goChatBot() {
    wx.navigateTo({ url: '/pages/chatBot/chatBot' });
  },

  // ---- 导出数据 ----
  exportData() {
    console.log('[导出] 按钮点击');
    wx.showActionSheet({
      itemList: ['导出 JSON', '导出 Markdown'],
      success: (res) => {
        console.log('[导出] 选择:', res.tapIndex);
        if (res.tapIndex === 0) {
          this.doExport('json');
        } else {
          this.doExport('md');
        }
      },
      fail: (err) => {
        console.log('[导出] 取消或失败:', err);
      },
    });
  },

  async doExport(format) {
    wx.showLoading({ title: '导出中...', mask: true });
    try {
      const allData = await this.fetchAllDecisions();
      console.log('[导出] 获取到数据:', allData.length, '条');
      if (!allData.length) {
        wx.hideLoading();
        wx.showToast({ title: '暂无数据可导出', icon: 'none' });
        return;
      }

      const content = format === 'json'
        ? this.buildJSON(allData)
        : this.buildMarkdown(allData);

      const ext = format === 'json' ? 'json' : 'md';
      const dateStr = this.formatExportDate(Date.now());
      const fileName = `棱镜决策_${dateStr}.${ext}`;

      const fs = wx.getFileSystemManager();
      const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('[导出] 文件已写入:', filePath);

      wx.hideLoading();

      // 提供两种导出方式供用户选择
      wx.showActionSheet({
        itemList: ['发送给好友/文件传输助手', '复制内容到剪贴板'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 分享文件（仅真机有效）
            if (wx.shareFileMessage) {
              wx.shareFileMessage({
                filePath,
                fileName,
                success() {
                  console.log('[导出] 分享成功');
                },
                fail(err) {
                  console.log('[导出] 分享失败:', err);
                  // 开发工具或用户取消时降级到剪贴板
                  wx.setClipboardData({
                    data: content,
                    success() {
                      wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
                    },
                  });
                },
              });
            } else {
              wx.setClipboardData({
                data: content,
                success() {
                  wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
                },
              });
            }
          } else {
            // 直接复制到剪贴板
            wx.setClipboardData({
              data: content,
              success() {
                wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
              },
            });
          }
        },
      });
    } catch (err) {
      wx.hideLoading();
      console.error('[导出] 失败:', err);
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  },

  async fetchAllDecisions() {
    const db = wx.cloud.database();
    const batch = 20;
    let all = [];
    let skip = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res = await db.collection('decisions')
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(batch)
        .get();
      if (!res.data || !res.data.length) break;
      all = all.concat(res.data);
      if (res.data.length < batch) break;
      skip += batch;
    }
    return all;
  },

  buildJSON(data) {
    // 清理前端展示字段，只保留原始数据
    const clean = data.map((item) => {
      const { swipeX, animating, emotionEmoji, emotionLabel,
        categoryLabel, createdDate, reviewDateStr,
        isOverdue, isReviewed, statusText, statusClass,
        ...raw } = item;
      return raw;
    });
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      app: '棱镜',
      total: clean.length,
      decisions: clean,
    }, null, 2);
  },

  buildMarkdown(data) {
    const emotionLabels = {
      anxious: '焦虑', excited: '兴奋', calm: '冷静',
      urgent: '急迫', confused: '纠结',
    };
    const categoryLabels = {
      product: '产品', investment: '投资', career: '工作', life: '人生',
    };

    const lines = [
      '# 棱镜 · 决策记录',
      '',
      `> 导出时间：${new Date().toLocaleString('zh-CN')}`,
      `> 共 ${data.length} 条决策`,
      '',
      '---',
      '',
    ];

    data.forEach((item, i) => {
      const date = new Date(item.createdAt).toLocaleDateString('zh-CN');
      const emotion = emotionLabels[item.emotion?.primary] || '';
      const category = categoryLabels[item.tags?.category] || '';
      const hasReview = !!item.review;

      lines.push(`## ${i + 1}. ${item.decision}`);
      lines.push('');
      lines.push(`- **日期**：${date}`);
      lines.push(`- **选择**：${item.chosenOption || ''}`);
      if (category) lines.push(`- **分类**：${category}`);
      if (emotion) lines.push(`- **情绪**：${emotion}`);
      if (item.reasoning) lines.push(`- **理由**：${item.reasoning}`);
      if (item.concerns) lines.push(`- **担心**：${item.concerns}`);
      if (item.expectations) lines.push(`- **预期**：${item.expectations}`);

      if (hasReview) {
        const r = item.review;
        lines.push('');
        lines.push('### 复盘');
        lines.push(`- **实际结果**：${r.actualOutcome || ''}`);
        lines.push(`- **结果类型**：${r.outcomeType === 'positive' ? '正面' : '负面'}`);
        if (r.wrongAssumptions) lines.push(`- **错误假设**：${r.wrongAssumptions}`);
        if (r.rightAssumptions) lines.push(`- **做对了什么**：${r.rightAssumptions}`);
      }

      if (item.aiAnalysis) {
        const a = item.aiAnalysis;
        lines.push('');
        lines.push('### 智能分析');
        if (a.coreIssue) lines.push(`- **核心洞察**：${a.coreIssue}`);
        if (a.summary) lines.push(`- **分析总结**：${a.summary}`);
        if (a.currentPattern) lines.push(`- **行为模式**：${a.currentPattern}`);
        if (a.suggestedPrinciple) lines.push(`- **建议原则**：${a.suggestedPrinciple}`);
        if (a.suggestion) lines.push(`- **下次建议**：${a.suggestion}`);
      }

      lines.push('');
      lines.push('---');
      lines.push('');
    });

    return lines.join('\n');
  },

  formatExportDate(ts) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  },

  // 长按导出按钮 → 开发者面板
  async showStats() {
    wx.showActionSheet({
      itemList: ['查看统计', '重置新手引导（调试）'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.doShowStats();
        } else {
          this.resetOnboarding();
        }
      },
    });
  },

  // 重置新手引导状态（调试用）
  async resetOnboarding() {
    try {
      // 清除引导标记
      wx.removeStorageSync('onboarding_sample_done');
      wx.removeStorageSync('onboarding_submitted');
      wx.removeStorageSync('onboarding_swipe_hint_done');
      wx.removeStorageSync('onboarding_early_review_done');

      // 删除示例决策
      const db = wx.cloud.database();
      const res = await db.collection('decisions')
        .where({ _isSample: true })
        .get();
      for (const item of (res.data || [])) {
        await db.collection('decisions').doc(item._id).remove();
      }

      wx.showToast({ title: '已重置，请重新进入', icon: 'success' });

      // 重新触发 onShow 流程
      setTimeout(() => {
        this.onShow();
      }, 1000);
    } catch (err) {
      console.error('重置失败:', err);
      wx.showToast({ title: '重置失败', icon: 'none' });
    }
  },

  async doShowStats() {
    wx.showLoading({ title: '统计中...', mask: true });
    try {
      const allData = await this.fetchAllDecisions();
      const total = allData.length;
      const reviewed = allData.filter((d) => d.review).length;
      const hasFeedback = allData.filter((d) => d.feedback).length;
      const wallBroken = allData.filter((d) => d.feedback?.agreed === true).length;
      const wallNotBroken = allData.filter((d) => d.feedback?.agreed === false).length;
      const wallRate = hasFeedback > 0
        ? (wallBroken / hasFeedback * 100).toFixed(1)
        : '-';

      // AI 模型分布
      const aiCount = allData.filter((d) => d.aiAnalysis).length;
      const fallbackCount = allData.filter((d) => d.aiAnalysis?.fallback).length;
      const deepseekCount = allData.filter(
        (d) => d.aiAnalysis && !d.aiAnalysis.fallback
          && d.aiAnalysis._meta?.model === 'deepseek-r1',
      ).length;

      // 正负面分布
      const positive = allData.filter((d) => d.review?.outcomeType === 'positive').length;
      const negative = allData.filter((d) => d.review?.outcomeType === 'negative').length;

      wx.hideLoading();

      const lines = [
        `📊 棱镜数据统计`,
        ``,
        `决策总数: ${total}`,
        `已复盘: ${reviewed} (${total ? (reviewed / total * 100).toFixed(0) : 0}%)`,
        ``,
        `🔨 破壁率: ${wallRate}%`,
        `  破壁: ${wallBroken} / 没破: ${wallNotBroken} / 未反馈: ${reviewed - hasFeedback}`,
        ``,
        `🤖 智能分析: ${aiCount}`,
        `  DeepSeek: ${deepseekCount} / 降级: ${fallbackCount}`,
        ``,
        `📈 结果分布:`,
        `  正面: ${positive} / 负面: ${negative}`,
      ];

      wx.showModal({
        title: '开发者统计',
        content: lines.join('\n'),
        showCancel: false,
        confirmText: '知道了',
      });
    } catch (err) {
      wx.hideLoading();
      console.error('[统计] 失败:', err);
      wx.showToast({ title: '统计失败', icon: 'none' });
    }
  },
});
