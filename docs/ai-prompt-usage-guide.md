# AI Prompt 使用指南

## 概述

本项目的AI Prompt分为4个层级,从基础标签分析到高级"去自欺"分析,逐步深入。

**核心原则**:
> "这个 AI 的职责不是'帮助用户感觉更好',而是'让用户更难继续骗自己'"

---

## 文件结构

```
backend/
├── config/
│   └── prompts.config.ts       # Prompt配置文件
└── services/
    └── ai.service.ts            # AI服务层
```

---

## 使用示例

### 1. 标签分析(决策输入时)

**场景**: 用户在第1页填写完"你要做什么决定"后,自动调用AI预判标签

```typescript
import { aiService } from './services/ai.service'

// 用户输入
const decisionText = "要不要把登录功能从密码改成扫码"

// 调用AI分析
const tags = await aiService.analyzeTags(decisionText)

console.log(tags)
// {
//   category: "product",
//   riskLevel: "medium",
//   reversibility: "reversible",
//   reasoning: "产品功能调整,影响用户体验但可回滚"
// }
```

---

### 2. 核心拆穿分析(复盘时)

**场景**: 用户完成复盘表单提交后,立即调用AI生成分析

```typescript
import { aiService } from './services/ai.service'

// 决策数据
const decision = {
  id: "123",
  decision: "要不要做这个新功能",
  chosenOption: "做!",
  reasoning: "市场有需求,用户一直在要求",
  concerns: "时间可能不够,技术难度不确定",
  emotion: {
    primary: "excited"  // 兴奋
  },
  expectations: "1个月上线,用户量增长20%",
  createdAt: new Date("2025-11-09")
}

// 复盘数据
const review = {
  actualOutcome: "拖了3个月才上线,用户只增长了5%",
  wrongAssumptions: "低估了技术难度,高估了用户需求强度",
  errorType: "both",  // 判断和执行都有问题
  influences: {
    emotion: true,      // 情绪影响
    newInfo: true,      // 中途客户提新需求
    externalPressure: true,  // 老板催进度
    resourceChange: false,
    other: false
  },
  reviewedAt: new Date("2026-02-09")
}

// 调用AI拆穿
const analysis = await aiService.analyzeDecision(decision, review)

console.log(analysis)
// {
//   summary: "你当时的'兴奋'情绪让你高估了执行速度...",
//   coreDeception: "你说最担心时间,但还是接受了新需求",
//   deniedAssumption: {
//     assumption: "1个月可以上线",
//     reality: "实际用了3个月"
//   },
//   avoidancePattern: "你在用'市场需求'掩盖决策仓促",
//   biasTypes: ["optimism_bias", "planning_fallacy"],
//   principle: "机会驱动型",
//   confidence: 0.85
// }
```

---

### 3. 高级"去自欺"分析(付费功能)

**场景**: 付费用户解锁,识别用户是在尝试还是在回避

```typescript
import { aiService } from './services/ai.service'

const advancedAnalysis = await aiService.advancedDeceptionAnalysis(
  decision,
  review
)

console.log(advancedAnalysis)
// {
//   isAvoidance: true,
//   avoidanceType: "ABC",  // 三种回避模式都存在
//   coreIssue: "这个决策更像是一次回避,而不是真正的承诺",
//   patterns: ["延迟承诺", "保留退路", "避免被评价"],
//   repeatConsequence: "如果继续这样,3年后你会发现自己原地踏步,一事无成"
// }
```

---

### 4. 行为原则提取(用户有5+决策后)

**场景**: 用户完成5次以上决策+复盘后,生成行为原则画像

```typescript
import { aiService } from './services/ai.service'

// 获取用户的所有决策
const userDecisions = await DecisionModel.find({ userId })
  .sort({ createdAt: -1 })
  .limit(10)  // 取最近10次

// 提取行为原则
const principles = await aiService.extractPrinciples(userDecisions)

console.log(principles)
// {
//   principle: "机会驱动型",
//   decisionStyle: "看到可能性就想做,但容易忽略资源约束和执行风险",
//   blindSpots: ["连续5次低估执行时间", "总在情绪高涨时做决策"],
//   patterns: {
//     常高估: ["执行速度", "用户需求强度"],
//     常低估: ["技术难度", "沟通成本"]
//   },
//   riskProfile: "风险追求",
//   repeatMistakes: "每次都说'最担心时间',但每次都接受新需求"
// }
```

---

## 在Controller中使用

### 示例: 决策提交接口

```typescript
// backend/controllers/decision.controller.ts

import { Request, Response } from 'express'
import { aiService } from '../services/ai.service'
import { DecisionModel } from '../models/decision.model'

export class DecisionController {
  
  /**
   * 创建决策
   */
  async createDecision(req: Request, res: Response) {
    try {
      const { 
        decision, 
        options, 
        chosenOption,
        reasoning,
        concerns,
        emotion,
        expectations,
        reviewPeriod
      } = req.body
      
      const userId = req.user.id
      
      // 1. 调用AI分析标签(异步,不阻塞用户)
      let tags = {
        category: 'product',
        riskLevel: 'medium',
        reversibility: 'reversible',
        aiGenerated: false
      }
      
      try {
        const aiTags = await aiService.analyzeTags(decision)
        tags = {
          ...aiTags,
          aiGenerated: true
        }
      } catch (error) {
        console.error('AI标签分析失败,使用默认值:', error)
      }
      
      // 2. 计算复盘日期
      const reviewDate = this.calculateReviewDate(reviewPeriod)
      
      // 3. 保存决策
      const newDecision = await DecisionModel.create({
        userId,
        decision,
        options,
        chosenOption,
        reasoning,
        concerns,
        emotion,
        expectations,
        reviewPeriod,
        reviewDate,
        tags,
        createdAt: new Date()
      })
      
      // 4. 返回结果
      res.status(201).json({
        success: true,
        data: newDecision
      })
      
    } catch (error) {
      console.error('创建决策失败:', error)
      res.status(500).json({
        success: false,
        message: '创建决策失败'
      })
    }
  }
  
  /**
   * 复盘决策
   */
  async reviewDecision(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { 
        actualOutcome,
        wrongAssumptions,
        errorType,
        influences
      } = req.body
      
      // 1. 获取原决策
      const decision = await DecisionModel.findById(id)
      
      if (!decision) {
        return res.status(404).json({
          success: false,
          message: '决策不存在'
        })
      }
      
      // 2. 保存复盘数据
      decision.review = {
        actualOutcome,
        wrongAssumptions,
        errorType,
        influences,
        reviewedAt: new Date()
      }
      
      // 3. 调用AI拆穿分析
      const analysis = await aiService.analyzeDecision(
        decision,
        decision.review
      )
      
      decision.aiAnalysis = {
        ...analysis,
        createdAt: new Date()
      }
      
      // 4. 保存
      await decision.save()
      
      // 5. 返回AI分析结果
      res.json({
        success: true,
        data: {
          decision,
          analysis
        }
      })
      
    } catch (error) {
      console.error('复盘失败:', error)
      res.status(500).json({
        success: false,
        message: '复盘失败'
      })
    }
  }
  
  /**
   * 计算复盘日期
   */
  private calculateReviewDate(period: string): Date {
    const now = new Date()
    
    switch (period) {
      case '1week':
        return new Date(now.setDate(now.getDate() + 7))
      case '1month':
        return new Date(now.setMonth(now.getMonth() + 1))
      case '3months':
        return new Date(now.setMonth(now.getMonth() + 3))
      case '6months':
        return new Date(now.setMonth(now.getMonth() + 6))
      default:
        return new Date(now.setMonth(now.getMonth() + 3))
    }
  }
}
```

---

## 环境配置

在`.env`文件中配置OpenAI API Key:

```bash
# OpenAI配置
OPENAI_API_KEY=sk-your-api-key-here

# 如果使用代理
OPENAI_BASE_URL=https://your-proxy.com/v1
```

---

## 成本估算

### AI调用成本(GPT-4)

| 功能 | Tokens消耗 | 单次成本 | 说明 |
|---|---|---|---|
| 标签分析 | ~100 tokens | ¥0.01 | 第1页自动调用 |
| 核心拆穿 | ~800 tokens | ¥0.08 | 复盘时调用 |
| 高级分析 | ~600 tokens | ¥0.06 | 付费功能 |
| 行为原则 | ~1500 tokens | ¥0.15 | 5次决策后 |

**单用户月成本**:
- 免费用户(1次决策+复盘): ¥0.09/月
- 付费用户(3次决策+复盘+1次高级): ¥0.33/月

**1000月活成本**: ¥90~¥330/月

---

## 优化建议

### 1. 缓存策略

对于相同的决策内容,可以缓存AI分析结果:

```typescript
import Redis from 'ioredis'

const redis = new Redis()

async analyzeTags(decisionText: string) {
  // 检查缓存
  const cacheKey = `ai:tags:${decisionText}`
  const cached = await redis.get(cacheKey)
  
  if (cached) {
    return JSON.parse(cached)
  }
  
  // AI调用
  const result = await this.openai.chat.completions.create(...)
  
  // 缓存结果(7天)
  await redis.setex(cacheKey, 7 * 24 * 3600, JSON.stringify(result))
  
  return result
}
```

---

### 2. 降级方案

当AI接口不可用时,使用预设模板:

```typescript
async analyzeDecision(decision, review) {
  try {
    return await this.callAI(decision, review)
  } catch (error) {
    console.error('AI调用失败,使用降级方案')
    
    return {
      summary: "AI分析暂时不可用,请稍后查看",
      coreDeception: "系统维护中",
      deniedAssumption: {
        assumption: decision.expectations,
        reality: review.actualOutcome
      },
      avoidancePattern: "",
      biasTypes: [],
      principle: "",
      confidence: 0
    }
  }
}
```

---

### 3. 国产大模型替代

如果成本过高,可以切换到国产模型:

```typescript
// 使用通义千问
import Tongyi from '@alicloud/tongyi'

const tongyi = new Tongyi({
  apiKey: process.env.TONGYI_API_KEY
})

// 或使用文心一言
import Wenxin from 'wenxin-sdk'

const wenxin = new Wenxin({
  apiKey: process.env.WENXIN_API_KEY
})
```

---

## 注意事项

1. **Prompt不要轻易修改**: 每次修改都需要大量测试验证
2. **记录AI输出**: 保存原始输出用于后续优化
3. **用户反馈很重要**: 用户点"不认同"时,记录下来
4. **定期Review**: 每月查看AI分析的准确率
5. **数据安全**: 不要把敏感信息发给AI

---

## 后续优化方向

1. **Fine-tuning**: 用真实用户数据微调模型
2. **多模型对比**: A/B测试不同模型的效果
3. **Prompt版本管理**: 记录每次修改和效果
4. **用户满意度监控**: 跟踪点赞率和分享率

---

## 参考资料

- [OpenAI API文档](https://platform.openai.com/docs/api-reference)
- [认知偏差列表](https://zh.wikipedia.org/wiki/認知偏誤列表)
- [思考,快与慢](https://book.douban.com/subject/10785583/)
