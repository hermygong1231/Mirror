// 云函数 decisionAI - AI分析决策
const cloud = require('wx-server-sdk');
cloud.init({ env: 'cloud1-1grnkl8gbfae008c' });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  const userId = wxContext.OPENID;

  switch (action) {
    case 'analyzeTags':
      return await analyzeTags(event.decision);
    case 'analyze':
      return await analyzeDecision(userId, event.decisionId);
    default:
      return { errCode: -1, errMsg: 'unknown action' };
  }
};

// AI标签分析
async function analyzeTags(decisionText) {
  if (!decisionText || decisionText.length < 3) {
    return { category: '', riskLevel: '', reversibility: '' };
  }

  try {
    const result = await cloud.openapi.cloudbaseAIBot.sendMessage({
      botId: 'default',
      msg: `你是一个决策分析专家，请分析以下决策的类型。

【用户的决策】
"${decisionText}"

请严格返回JSON格式（不要返回其他内容）：
{
  "category": "product|investment|career|life",
  "riskLevel": "low|medium|high",
  "reversibility": "reversible|irreversible",
  "reasoning": "简短说明(30字内)"
}

其中：
- category: product(产品功能)、investment(投资理财)、career(工作发展)、life(人生选择)
- riskLevel: low(可控影响小)、medium(有风险但可承受)、high(重大影响)
- reversibility: reversible(可以改回来)、irreversible(无法撤销)`,
    });

    const content = result.reply || '';
    // 尝试提取JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { category: 'product', riskLevel: 'medium', reversibility: 'reversible' };
  } catch (err) {
    console.error('AI标签分析失败:', err);
    // 基于关键词简单判断
    return fallbackTagAnalysis(decisionText);
  }
}

// 降级方案：关键词匹配
function fallbackTagAnalysis(text) {
  let category = 'product';
  if (/投资|理财|股票|基金|买房/.test(text)) category = 'investment';
  if (/跳槽|离职|晋升|工作|转行/.test(text)) category = 'career';
  if (/结婚|搬家|留学|移民|考研/.test(text)) category = 'life';

  let riskLevel = 'medium';
  if (/大|重要|关键|重大/.test(text)) riskLevel = 'high';
  if (/小|简单|微调|试试/.test(text)) riskLevel = 'low';

  let reversibility = 'reversible';
  if (/不可逆|无法|永久|放弃/.test(text)) reversibility = 'irreversible';

  return { category, riskLevel, reversibility };
}

// AI拆穿分析
async function analyzeDecision(userId, decisionId) {
  const doc = await db.collection('decisions').doc(decisionId).get();
  const decision = doc.data;

  if (!decision || decision.userId !== userId) {
    throw new Error('决策不存在');
  }

  if (!decision.review) {
    throw new Error('尚未复盘');
  }

  const emotionLabels = {
    anxious: '焦虑',
    excited: '兴奋',
    calm: '冷静',
    urgent: '急迫',
    confused: '纠结',
  };

  const errorTypeLabels = {
    judgment: '判断错了',
    execution: '执行错了',
    both: '判断和执行都有问题',
  };

  const emotionLabel = emotionLabels[decision.emotion?.primary] || '未知';
  const errorLabel = errorTypeLabels[decision.review.errorType] || '未知';

  const influences = [];
  const inf = decision.review.influences || {};
  if (inf.emotion) influences.push('情绪影响');
  if (inf.newInfo) influences.push('新信息干扰');
  if (inf.externalPressure) influences.push('外部压力');
  if (inf.resourceChange) influences.push('资源变化');
  if (inf.other) influences.push('其他');

  const prompt = `你是一个认知偏差识别专家，客观分析用户的决策，不要安慰，要直接指出问题。

【决策时的信息】
决定: ${decision.decision}
选择: ${decision.chosenOption}
理由: ${decision.reasoning}
担心: ${decision.concerns}
情绪: ${emotionLabel}
预期: ${decision.expectations}

【复盘时的信息】
实际结果: ${decision.review.actualOutcome}
错误假设: ${decision.review.wrongAssumptions}
错误类型: ${errorLabel}
影响因素: ${influences.join('、')}
${inf.details ? `补充说明: ${inf.details}` : ''}

请严格返回JSON格式（不要返回其他内容）：
{
  "summary": "200字对比分析(包含结果对比+核心问题+偏差解释)",
  "coreIssue": "一句话刺穿问题本质(不超过30字)",
  "biasTypes": ["从以下选2-3个: optimism_bias, planning_fallacy, confirmation_bias, sunk_cost_fallacy, anchoring_bias, overconfidence_bias, availability_bias"],
  "principle": "行为原则(不超过10字，如'机会驱动型')",
  "suggestion": "下次决策建议(具体可执行，一句话)",
  "confidence": 0.85
}`;

  try {
    const result = await cloud.openapi.cloudbaseAIBot.sendMessage({
      botId: 'default',
      msg: prompt,
    });

    const content = result.reply || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    let analysis;

    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      analysis = {
        summary: content || 'AI分析暂时不可用',
        coreIssue: '',
        biasTypes: [],
        principle: '',
        suggestion: '',
        confidence: 0,
      };
    }

    // 保存分析结果到数据库
    await db.collection('decisions').doc(decisionId).update({
      data: {
        aiAnalysis: {
          ...analysis,
          createdAt: Date.now(),
        },
        updatedAt: Date.now(),
      },
    });

    return analysis;
  } catch (err) {
    console.error('AI分析失败:', err);
    // 降级方案
    const fallback = {
      summary: `你当时因为"${emotionLabel}"的情绪做出了这个决策。你的预期是"${decision.expectations}"，但实际结果是"${decision.review.actualOutcome}"。这表明你可能${decision.review.errorType === 'judgment' ? '在判断阶段就出了偏差' : '在执行过程中出了问题'}。`,
      coreIssue: `你说最担心"${decision.concerns.substring(0, 15)}"，但结果仍然验证了这个担心`,
      biasTypes: ['optimism_bias'],
      principle: '',
      suggestion: '下次做决策时，多关注你"最担心"的那个风险',
      confidence: .4,
    };

    await db.collection('decisions').doc(decisionId).update({
      data: {
        aiAnalysis: { ...fallback, createdAt: Date.now() },
        updatedAt: Date.now(),
      },
    });

    return fallback;
  }
}
