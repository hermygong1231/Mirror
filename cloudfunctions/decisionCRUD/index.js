// 云函数 decisionCRUD - 决策CRUD操作
const cloud = require('wx-server-sdk');
cloud.init({ env: 'cloud1-1grnkl8gbfae008c' });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, data } = event;
  const wxContext = cloud.getWXContext();
  const userId = wxContext.OPENID;

  switch (action) {
    case 'create':
      return await createDecision(userId, data);
    case 'list':
      return await listDecisions(userId, data);
    case 'get':
      return await getDecision(userId, data);
    case 'review':
      return await reviewDecision(userId, data);
    case 'feedback':
      return await addFeedback(userId, data);
    default:
      return { errCode: -1, errMsg: 'unknown action' };
  }
};

// 创建决策
async function createDecision(userId, data) {
  const result = await db.collection('decisions').add({
    data: {
      userId,
      decision: data.decision,
      options: data.options,
      chosenOption: data.chosenOption,
      tags: data.tags || {},
      reasoning: data.reasoning,
      concerns: data.concerns,
      emotion: data.emotion || {},
      expectations: data.expectations,
      reviewPeriod: data.reviewPeriod,
      reviewDate: data.reviewDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      review: null,
      aiAnalysis: null,
      userFeedback: null,
    },
  });
  return { errCode: 0, data: { _id: result._id } };
}

// 列表查询
async function listDecisions(userId, data) {
  const { page = 0, pageSize = 20, filter = 'all' } = data;
  let query = db.collection('decisions').where({ userId });

  if (filter === 'pending') {
    query = query.where({
      review: null,
      reviewDate: _.lte(Date.now()),
    });
  } else if (filter === 'reviewed') {
    query = query.where({
      review: _.neq(null),
    });
  }

  const result = await query
    .orderBy('createdAt', 'desc')
    .skip(page * pageSize)
    .limit(pageSize)
    .get();

  return { errCode: 0, data: result.data };
}

// 获取单个决策
async function getDecision(userId, data) {
  const result = await db
    .collection('decisions')
    .doc(data.id)
    .get();

  if (!result.data || result.data.userId !== userId) {
    return { errCode: -1, errMsg: 'not found' };
  }

  return { errCode: 0, data: result.data };
}

// 复盘
async function reviewDecision(userId, data) {
  const { id, review } = data;

  // 先检查权限
  const doc = await db.collection('decisions').doc(id).get();
  if (!doc.data || doc.data.userId !== userId) {
    return { errCode: -1, errMsg: 'not found' };
  }

  await db
    .collection('decisions')
    .doc(id)
    .update({
      data: {
        review,
        updatedAt: Date.now(),
      },
    });

  return { errCode: 0 };
}

// 反馈
async function addFeedback(userId, data) {
  const { id, feedback } = data;

  await db
    .collection('decisions')
    .doc(id)
    .update({
      data: {
        userFeedback: feedback,
        updatedAt: Date.now(),
      },
    });

  return { errCode: 0 };
}
