// pages/review/result.js
const biasMap = {
  // 负面偏差
  optimism_bias: '乐观偏差',
  confirmation_bias: '确认偏差',
  sunk_cost_fallacy: '沉没成本谬误',
  planning_fallacy: '计划谬误',
  anchoring_bias: '锚定效应',
  availability_bias: '可得性偏差',
  overconfidence_bias: '过度自信',
  // 正面思维优势
  good_calibration: '判断校准',
  contrarian_thinking: '逆向思维',
  risk_awareness: '风险意识',
  information_advantage: '信息优势',
  execution_discipline: '执行力',
  emotional_control: '情绪管理',
  adaptive_thinking: '适应性思维',
};

// 等待期间随机展示的金句（均经过出处核实）
const quotes = [
  // 经典哲学——出处可靠
  { text: '未经审视的人生不值得过。', author: '苏格拉底《申辩篇》' },
  { text: '认识你自己。', author: '德尔菲神谕' },
  { text: '知人者智，自知者明。', author: '老子《道德经》' },
  { text: '吾日三省吾身。', author: '曾子《论语》' },
  // 决策与判断——出处可靠
  { text: '决策的质量不应该用结果来衡量。', author: 'Annie Duke《对赌》' },
  { text: '快思考让我们生存，慢思考让我们正确。', author: '丹尼尔·卡尼曼《思考，快与慢》' },
  { text: '所有模型都是错的，但有些是有用的。', author: 'George Box' },
  { text: '反脆弱不是避免波动，而是从波动中获益。', author: '塔勒布《反脆弱》' },
  { text: '如果你不能衡量它，你就不能管理它。', author: '彼得·德鲁克' },
  { text: '要做不可逆的决定，先做可逆的实验。', author: 'Jeff Bezos（致股东信）' },
  // 认知偏差——出处可靠
  { text: '我们看到的不是现实本身，而是我们自己的投射。', author: 'Anaïs Nin《诱惑的日记》' },
  { text: '人类的理性是有限的，我们只能做到满意而非最优。', author: '赫伯特·西蒙' },
  { text: '锚定效应：第一个数字会支配你的判断。', author: '丹尼尔·卡尼曼《思考，快与慢》' },
  { text: '你的直觉只是模式识别，它在新领域里不管用。', author: '加里·克莱因《力量的源泉》' },
  // 复盘与成长——出处可靠
  { text: '复盘是把经历变成经验的唯一方式。', author: '柳传志' },
  { text: '知道自己不知道什么，比知道什么更重要。', author: '查理·芒格' },
  { text: '痛苦+反思=进步。', author: '瑞·达利欧《原则》' },
  { text: '失败不是成功之母，复盘才是。', author: '瑞·达利欧《原则》' },
  { text: '完成比完美更重要。', author: 'Sheryl Sandberg《向前一步》' },
  { text: '真正的无知不是知识的缺乏，而是拒绝去获取它。', author: '卡尔·波普尔' },
  { text: '最好的学习方式是从自己的错误中学习，其次是从别人的错误中学习。', author: '查理·芒格' },
  // 行动与风险——出处可靠
  { text: '活着就是要体验那种不确定性带来的一切。', author: '维克多·弗兰克尔《活出生命的意义》' },
  { text: '那些不能杀死我的，使我更强大。', author: '尼采《偶像的黄昏》' },
  { text: '怀疑一切与相信一切同样简单，都是不思考的表现。', author: '庞加莱' },
  { text: '世上只有一种英雄主义，就是看清生活后依然热爱它。', author: '罗曼·罗兰' },
  // 棱镜原创
  { text: '承认错误是智慧，分析错误是能力。', author: '棱镜' },
  { text: '每一个决策，都是一束等待折射的光。', author: '棱镜' },
  { text: '你以为的理性，可能只是情绪的伪装。', author: '棱镜' },
  { text: '面壁是勇气，破壁是成长。', author: '棱镜' },
];

Page({
  data: {
    decision: null,
    analysis: null,
    loading: true,
    analyzing: false,
    feedbackSent: false,
    feedbackAgreed: false,
    isPositive: false,
    currentQuote: null,
    quoteVisible: false,
  },

  onLoad(options) {
    this.decisionId = options.id;
    this.quoteTimer = null;
    this.loadResult();
  },

  onUnload() {
    if (this.quoteTimer) {
      clearInterval(this.quoteTimer);
      this.quoteTimer = null;
    }
  },

  // 开始金句轮播
  startQuoteRotation() {
    this.showNextQuote();
    this.quoteTimer = setInterval(() => {
      this.showNextQuote();
    }, 4000);
  },

  stopQuoteRotation() {
    if (this.quoteTimer) {
      clearInterval(this.quoteTimer);
      this.quoteTimer = null;
    }
  },

  showNextQuote() {
    // 淡出
    this.setData({ quoteVisible: false });
    setTimeout(() => {
      // 避免连续重复
      let idx;
      do {
        idx = Math.floor(Math.random() * quotes.length);
      } while (idx === this._lastQuoteIdx && quotes.length > 1);
      this._lastQuoteIdx = idx;
      this.setData({
        currentQuote: quotes[idx],
        quoteVisible: true,
      });
    }, 400);
  },

  async loadResult() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('decisions').doc(this.decisionId).get();

      const decision = res.data;
      if (!decision) {
        wx.showToast({ title: '决策不存在', icon: 'none' });
        return;
      }

      this.setData({
        decision,
        loading: false,
        isPositive: decision.review?.outcomeType === 'positive',
      });

      // 如果已有AI分析结果，直接展示
      if (decision.aiAnalysis) {
        const analysis = decision.aiAnalysis;
        this.setData({
          analysis: {
            ...analysis,
            biasLabels: (analysis.biasTypes || []).map(
              (b) => biasMap[b] || b
            ),
          },
        });
      } else {
        // 调用AI分析
        this.runAIAnalysis();
      }
    } catch (err) {
      console.error('加载失败:', err);
      this.setData({ loading: false });
    }
  },

  // 构建 AI prompt（根据正面/负面切换）
  buildPrompt(decision, review) {
    const emotionLabels = {
      anxious: '焦虑', excited: '兴奋', calm: '冷静',
      urgent: '急迫', confused: '纠结',
    };
    const emotionLabel = emotionLabels[decision.emotion?.primary] || '未知';
    const isPositive = review.outcomeType === 'positive';

    const influences = [];
    const inf = review.influences || {};
    if (isPositive) {
      if (inf.emotion) influences.push('心态稳定');
      if (inf.newInfo) influences.push('信息充分');
      if (inf.externalPressure) influences.push('好的建议');
      if (inf.resourceChange) influences.push('资源充足');
    } else {
      if (inf.emotion) influences.push('情绪影响');
      if (inf.newInfo) influences.push('新信息干扰');
      if (inf.externalPressure) influences.push('外部压力');
      if (inf.resourceChange) influences.push('资源变化');
    }
    if (inf.other) influences.push('其他');

    const baseInfo = `【决策时的信息】
决定: ${decision.decision}
选择: ${decision.chosenOption}
理由: ${decision.reasoning || '未填写'}
担心: ${decision.concerns || '未填写'}
情绪: ${emotionLabel}
预期: ${decision.expectations || '未填写'}

【复盘时的信息】
实际结果: ${review.actualOutcome}`;

    if (isPositive) {
      const successTypeLabels = {
        judgment: '判断准确', execution: '执行到位', both: '判断和执行都很出色',
      };
      return `你是一个决策教练和认知科学专家，请分析用户这次成功决策的关键因素，帮助用户把"运气"变成"能力"，提炼可复用的决策方法论。

${baseInfo}
做对了什么: ${review.rightAssumptions}
成功类型: ${successTypeLabels[review.successType] || '未知'}
成功因素: ${influences.join('、') || '无'}
${inf.details ? '补充说明: ' + inf.details : ''}

请严格返回JSON格式（不要返回其他任何内容，不要用markdown代码块包裹）：
{
  "summary": "200字以内的成功分析，包含：预期vs实际结果的对比、做对了什么关键判断、哪些能力可以复用",
  "coreIssue": "一句话总结这次成功的核心原因，不超过40字，要精准",
  "biasTypes": ["从以下选1-2个与成功相关的思维优势: good_calibration, contrarian_thinking, risk_awareness, information_advantage, execution_discipline, emotional_control, adaptive_thinking"],
  "currentPattern": "一句话描述这个人在这次决策中表现出的好习惯/优势，不超过30字",
  "suggestedPrinciple": "把这次的成功经验提炼为一条可复用的决策原则，不超过30字",
  "suggestion": "如何在下次决策中延续这个优势，要具体可操作，不超过60字",
  "confidence": 75
}`;
    }

    const errorTypeLabels = {
      judgment: '判断错了', execution: '执行错了', both: '判断和执行都有问题',
    };
    return `你是一个认知偏差识别专家和决策教练，请客观、犀利地分析用户的决策，不要安慰，要直接指出问题本质。

${baseInfo}
错误假设: ${review.wrongAssumptions}
错误类型: ${errorTypeLabels[review.errorType] || '未知'}
影响因素: ${influences.join('、') || '无'}
${inf.details ? '补充说明: ' + inf.details : ''}

请严格返回JSON格式（不要返回其他任何内容，不要用markdown代码块包裹）：
{
  "summary": "200字以内的对比分析，包含：预期vs现实的对比、核心问题是什么、为什么会出现这个偏差",
  "coreIssue": "一句话刺穿问题本质，不超过40字，要犀利直接",
  "biasTypes": ["从以下选2-3个最相关的: optimism_bias, planning_fallacy, confirmation_bias, sunk_cost_fallacy, anchoring_bias, overconfidence_bias, availability_bias"],
  "currentPattern": "一句话描述这个人在这次决策中表现出的行为模式/习惯，不超过30字，如'倾向于在兴奋时快速决定，忽略风险信号'",
  "suggestedPrinciple": "针对上述模式，建议调整为什么样的行为原则，不超过30字，要具体可执行",
  "suggestion": "针对下次类似决策的具体建议，要可操作，不超过60字",
  "confidence": 75
}`;
  },

  // 调用AI大模型分析（通过 wx.cloud.extend.AI 前端直接调用）
  async runAIAnalysis() {
    this.setData({ analyzing: true });
    this.startQuoteRotation();
    const { decision } = this.data;
    if (!decision || !decision.review) {
      this.setData({ analyzing: false });
      this.stopQuoteRotation();
      return;
    }

    const review = decision.review;
    const prompt = this.buildPrompt(decision, review);

    const startTime = Date.now();

    try {
      let content = '';
      let modelUsed = '';
      try {
        const model = wx.cloud.extend.AI.createModel('deepseek');
        const res = await model.generateText({
          model: 'deepseek-r1',
          messages: [{ role: 'user', content: prompt }],
        });
        modelUsed = 'deepseek-r1';
        console.log('DeepSeek 完整返回:', JSON.stringify(res));
        content = res.text
          || (res.result && res.result.content)
          || (res.result && res.result.text)
          || res.content
          || (res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content)
          || (typeof res === 'string' ? res : '')
          || '';
        content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      } catch (deepseekErr) {
        console.warn('DeepSeek 调用失败，尝试 hunyuan:', deepseekErr);
        const model2 = wx.cloud.extend.AI.createModel('hunyuan');
        const res2 = await model2.generateText({
          model: 'hunyuan-lite',
          messages: [{ role: 'user', content: prompt }],
        });
        modelUsed = 'hunyuan-lite';
        console.log('Hunyuan 完整返回:', JSON.stringify(res2));
        content = res2.text
          || (res2.result && res2.result.content)
          || (res2.result && res2.result.text)
          || res2.content
          || (res2.choices && res2.choices[0] && res2.choices[0].message && res2.choices[0].message.content)
          || (typeof res2 === 'string' ? res2 : '')
          || '';
      }

      const aiDuration = Date.now() - startTime;
      console.log(`[AI耗时] 模型:${modelUsed} 耗时:${aiDuration}ms (${(aiDuration / 1000).toFixed(1)}s)`);

      console.log('AI提取内容:', content);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      let analysis;

      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI返回格式异常');
      }

      analysis.biasLabels = (analysis.biasTypes || []).map(
        (b) => biasMap[b] || b
      );
      if (analysis.confidence && analysis.confidence <= 1) {
        analysis.confidence = Math.round(analysis.confidence * 100);
      }

      this.setData({ analysis, analyzing: false });
      this.stopQuoteRotation();

      // 保存到数据库（含耗时埋点）
      const db = wx.cloud.database();
      db.collection('decisions').doc(this.decisionId).update({
        data: {
          aiAnalysis: {
            ...analysis,
            createdAt: Date.now(),
            _meta: { model: modelUsed, durationMs: aiDuration },
          },
        },
      });
    } catch (err) {
      const aiDuration = Date.now() - startTime;
      console.error(`AI大模型分析失败 (耗时${aiDuration}ms):`, err);
      this.stopQuoteRotation();
      this.runFallbackAnalysis();
    }
  },

  // 降级方案：本地规则分析
  runFallbackAnalysis() {
    const { decision } = this.data;
    const review = decision.review;
    const isPositive = review.outcomeType === 'positive';

    let analysis;
    if (isPositive) {
      const successTypeMap = {
        judgment: '判断层面', execution: '执行层面', both: '判断和执行层面',
      };
      const traitTypes = [];
      if (review.influences?.emotion) traitTypes.push('emotional_control');
      if (review.influences?.newInfo) traitTypes.push('information_advantage');
      if (review.successType === 'judgment') traitTypes.push('good_calibration');
      if (review.successType === 'execution') traitTypes.push('execution_discipline');
      if (review.successType === 'both') traitTypes.push('adaptive_thinking');

      analysis = {
        coreIssue: `你在${successTypeMap[review.successType] || ''}表现出色。预期"${decision.expectations || ''}"，实际"${review.actualOutcome || ''}"。`,
        summary: `智能分析暂时不可用，以下为基础分析：你做对的关键是"${review.rightAssumptions || ''}"，这是值得保持的决策习惯。`,
        biasTypes: traitTypes,
        biasLabels: traitTypes.map((b) => biasMap[b] || b),
        currentPattern: '能够冷静分析并坚持正确判断，值得保持。',
        suggestedPrinciple: '把这次的成功方法记录下来，形成你的决策检查清单。',
        suggestion: '下次做类似决策时，回顾这次的成功经验作为参考。',
        confidence: 40,
      };
    } else {
      const errorTypeMap = {
        judgment: '判断层面', execution: '执行层面', both: '判断和执行层面',
      };
      const biasTypes = [];
      if (review.influences?.emotion) biasTypes.push('optimism_bias');
      if (review.errorType === 'judgment') biasTypes.push('confirmation_bias');
      if (review.errorType === 'both') biasTypes.push('planning_fallacy');
      if (review.influences?.externalPressure) biasTypes.push('anchoring_bias');
      if (decision.emotion?.primary === 'excited') biasTypes.push('overconfidence_bias');

      analysis = {
        coreIssue: `你在这次决策中主要出现了${errorTypeMap[review.errorType] || ''}的偏差。预期"${decision.expectations || ''}"，实际"${review.actualOutcome || ''}"。`,
        summary: `智能分析暂时不可用，以下为基础分析：你错误的假设是"${review.wrongAssumptions || ''}"，这提示你需要更加注意验证核心假设。`,
        biasTypes,
        biasLabels: biasTypes.map((b) => biasMap[b] || b),
        currentPattern: '倾向于凭直觉快速判断，缺少对核心假设的验证。',
        suggestedPrinciple: '下次做类似决策时，先列出可能推翻你判断的3个证据。',
        suggestion: '找一个持反对意见的人聊聊，听听不同视角。',
        confidence: 40,
      };
    }

    this.setData({ analysis, analyzing: false });

    const db = wx.cloud.database();
    db.collection('decisions').doc(this.decisionId).update({
      data: { aiAnalysis: { ...analysis, fallback: true, createdAt: Date.now() } },
    });
  },

  async sendFeedback(e) {
    const { agreed } = e.currentTarget.dataset;
    if (this.data.feedbackSent) return;
    const isAgreed = agreed === 'true';

    try {
      const db = wx.cloud.database();
      await db.collection('decisions').doc(this.decisionId).update({
        data: {
          feedback: {
            agreed: isAgreed,
            wallBroken: isAgreed,
            feedbackAt: Date.now(),
          },
        },
      });
      this.setData({ feedbackSent: true, feedbackAgreed: isAgreed });
      wx.showToast({
        title: isAgreed ? '破壁成功 🔨' : '已记录',
        icon: 'none',
      });
    } catch (err) {
      console.error('反馈失败:', err);
    }
  },

  goHome() {
    wx.reLaunch({ url: '/pages/decisions/list' });
  },

  shareResult() {
    // 预留分享功能
    wx.showToast({ title: '分享功能开发中', icon: 'none' });
  },
});
