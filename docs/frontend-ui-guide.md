# 前端UI开发指南

## 已创建的文件

✅ **配置文件**
- `tailwind.config.js` - Tailwind配置(颜色/间距/动画)
- `frontend/README.md` - 项目说明

✅ **类型定义**
- `src/types/index.ts` - 完整TypeScript类型

✅ **核心组件**
- `src/components/ProgressBar.vue` - 进度条
- `src/components/EmotionPicker.vue` - 情绪选择器
- `src/components/AIAnalysis.vue` - AI分析结果展示

✅ **页面**
- `src/pages/create/step1.vue` - 创建决策第1页(完整实现)

✅ **API**
- `src/api/decision.ts` - 决策相关接口

---

## 快速开始

### 1. 初始化项目

```bash
# 创建UniApp项目(Vue3 + TS)
npx degit dcloudio/uni-preset-vue#vite-ts frontend
cd frontend

# 安装依赖
npm install

# 安装Tailwind CSS
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
npm install -D @dcloudio/uni-tailwindcss

# 安装Pinia
npm install pinia

# 安装uView UI(可选)
npm install uview-plus
```

### 2. 复制配置文件

把以下文件复制到项目根目录:
- `tailwind.config.js`
- `src/types/index.ts`
- `src/components/*.vue`
- `src/pages/create/step1.vue`
- `src/api/decision.ts`

### 3. 配置pages.json

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "我的决策"
      }
    },
    {
      "path": "pages/create/step1",
      "style": {
        "navigationBarTitleText": "记录决策 1/3"
      }
    },
    {
      "path": "pages/create/step2",
      "style": {
        "navigationBarTitleText": "记录决策 2/3"
      }
    },
    {
      "path": "pages/create/step3",
      "style": {
        "navigationBarTitleText": "记录决策 3/3"
      }
    },
    {
      "path": "pages/review/recall",
      "style": {
        "navigationBarTitleText": "回顾决策"
      }
    },
    {
      "path": "pages/review/input",
      "style": {
        "navigationBarTitleText": "填写复盘"
      }
    },
    {
      "path": "pages/review/result",
      "style": {
        "navigationBarTitleText": "AI分析结果"
      }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "面壁人",
    "navigationBarBackgroundColor": "#FFFFFF",
    "backgroundColor": "#F9FAFB"
  }
}
```

### 4. 运行项目

```bash
# 微信小程序开发模式
npm run dev:mp-weixin

# 编译后在微信开发者工具中打开 dist/dev/mp-weixin
```

---

## 设计系统

### 颜色规范

```typescript
// 主色(Primary) - 用于决策/理性/重要按钮
primary-50 到 primary-900
主色: #2563eb (primary-600)

// 危险色(Danger) - 用于拆穿/警告/删除
danger-50 到 danger-900
主色: #ef4444 (danger-500)

// 成功色(Success) - 用于完成/确认
success-50 到 success-900
主色: #22c55e (success-500)

// 中性色(Gray) - 用于文本/背景/边框
gray-50: #f9fafb (页面背景)
gray-100: #f3f4f6 (卡片背景)
gray-500: #6b7280 (辅助文字)
gray-900: #111827 (主要文字)
```

### 间距规范

```
p-3  = 12px  (小内边距)
p-4  = 16px  (标准内边距)
p-6  = 24px  (大内边距)

gap-2 = 8px  (小间距)
gap-3 = 12px (标准间距)
gap-4 = 16px (大间距)
```

### 字体规范

```
text-xs   = 12px (辅助文字)
text-sm   = 14px (正文小字)
text-base = 16px (正文)
text-lg   = 18px (小标题)
text-xl   = 20px (标题)
text-2xl  = 24px (大标题)
```

### 圆角规范

```
rounded-lg   = 8px  (小圆角)
rounded-xl   = 12px (标准圆角)
rounded-2xl  = 16px (大圆角)
rounded-full = 9999px (圆形)
```

---

## 核心组件使用示例

### 1. ProgressBar进度条

```vue
<template>
  <ProgressBar 
    :current-step="1" 
    :total-steps="3"
    :step-labels="['决策', '理由', '预期']"
  />
</template>
```

### 2. EmotionPicker情绪选择器

```vue
<template>
  <EmotionPicker
    v-model="emotion"
    @update:note="handleNoteChange"
    title="你现在的情绪?"
    :required="true"
    :show-note="true"
  />
</template>

<script setup>
import { ref } from 'vue'

const emotion = ref(null)

const handleNoteChange = (note) => {
  console.log('情绪补充:', note)
}
</script>
```

### 3. AIAnalysis分析结果展示

```vue
<template>
  <AIAnalysis
    :analysis="analysisData"
    @feedback="handleFeedback"
    @share="handleShare"
  />
</template>

<script setup>
const analysisData = {
  summary: "你当时的'兴奋'情绪让你高估了执行速度...",
  coreDeception: "你说最担心时间,但还是接受了新需求",
  deniedAssumption: {
    assumption: "1个月可以上线",
    reality: "实际用了3个月"
  },
  avoidancePattern: "你在用'市场需求'掩盖决策仓促",
  biasTypes: ["optimism_bias", "planning_fallacy"],
  principle: "机会驱动型",
  confidence: 0.85
}

const handleFeedback = (agreed) => {
  console.log('用户反馈:', agreed)
}

const handleShare = () => {
  console.log('生成分享卡片')
}
</script>
```

---

## 待开发页面清单

### 第1优先级(MVP核心)

✅ **已完成**
- Step1: 决策是什么

⏳ **待开发**
- Step2: 为什么选择 (参考Step1结构)
- Step3: 预期与复盘 (参考Step1结构)
- 复盘页面 Recall: 回顾决策
- 复盘页面 Input: 填写复盘
- 复盘页面 Result: AI拆穿结果
- 决策列表(首页)

### 第2优先级(功能完善)

- 决策详情页
- 个人中心
- 分享卡片生成
- 设置页面

### 第3优先级(增值功能)

- 行为原则画像
- 决策趋势图表
- 高级AI分析(付费)

---

## 开发建议

### 1. 代码复用

Step2和Step3的结构与Step1类似,可以复用:
- 表单布局结构
- 进度条组件
- 底部按钮
- 草稿保存逻辑

**Step2要点**:
- 理由输入(textarea)
- 担心输入(textarea + 特殊样式)
- 情绪选择器(EmotionPicker组件)

**Step3要点**:
- 预期输入(textarea)
- 复盘时间选择(大按钮,4个选项)
- 可选标签(已由AI预填,可调整)

### 2. 状态管理

使用Pinia管理全局状态:

```typescript
// stores/draft.ts
import { defineStore } from 'pinia'

export const useDraftStore = defineStore('draft', {
  state: () => ({
    step1Data: null,
    step2Data: null,
    step3Data: null,
    currentStep: 1
  }),
  
  actions: {
    saveStep1(data) {
      this.step1Data = data
      this.currentStep = 2
    },
    
    clearDraft() {
      this.step1Data = null
      this.step2Data = null
      this.step3Data = null
      this.currentStep = 1
    }
  }
})
```

### 3. 网络请求

使用`src/api/decision.ts`中的接口:

```typescript
import { analyzeDecisionTags, createDecision } from '@/api/decision'

// 1. AI标签分析
const tags = await analyzeDecisionTags(decisionText)

// 2. 创建决策
const decision = await createDecision({
  decision: '...',
  options: ['...'],
  chosenOption: '...',
  // ... 其他字段
})
```

### 4. 语音输入

使用微信小程序API:

```typescript
const handleVoiceInput = (field: string) => {
  uni.getSetting({
    success: (res) => {
      if (!res.authSetting['scope.record']) {
        // 请求授权
        uni.authorize({
          scope: 'scope.record',
          success: () => startRecording(field)
        })
      } else {
        startRecording(field)
      }
    }
  })
}

const startRecording = (field: string) => {
  const recorderManager = uni.getRecorderManager()
  
  recorderManager.onStop((res) => {
    // 上传音频,调用语音识别API
    uni.uploadFile({
      url: '/api/voice/recognize',
      filePath: res.tempFilePath,
      name: 'file',
      success: (uploadRes) => {
        const text = JSON.parse(uploadRes.data).text
        // 填入对应字段
        formData.value[field] = text
      }
    })
  })
  
  recorderManager.start({
    duration: 60000,
    format: 'mp3'
  })
}
```

---

## 性能优化建议

### 1. 图片优化
```vue
<!-- 使用webp格式 -->
<image 
  src="/static/images/logo.webp"
  mode="aspectFit"
  lazy-load
/>
```

### 2. 长列表优化
```vue
<!-- 使用虚拟滚动 -->
<recycle-list
  :list="decisions"
  :item-height="120"
/>
```

### 3. 首屏渲染优化
```typescript
// 骨架屏
<view v-if="loading" class="skeleton">
  <view class="skeleton-line"></view>
  <view class="skeleton-line"></view>
</view>
```

---

## 调试技巧

### 1. 控制台输出
```typescript
console.log('调试信息:', data)
```

### 2. 微信开发者工具
- 打开调试器
- 查看Network请求
- 查看Storage数据

### 3. 真机调试
```bash
# 生成预览二维码
npm run dev:mp-weixin
```

---

## 常见问题

### 1. Tailwind样式不生效?
确保已配置`postcss.config.js`:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

### 2. 微信小程序包体积超限?
- 开启分包加载
- 压缩图片资源
- 按需引入组件

### 3. iOS底部安全区域?
使用`safe-area-inset-bottom`类:
```vue
<view class="fixed bottom-0 safe-area-inset-bottom">
  底部按钮
</view>
```

---

## 下一步行动

1. **完成Step2和Step3页面**(2天)
2. **完成复盘流程3个页面**(3天)
3. **完成决策列表首页**(2天)
4. **集成后端API**(1天)
5. **测试和优化**(2天)

**总计**: 10天完成MVP前端开发

---

## 参考资料

- [UniApp文档](https://uniapp.dcloud.net.cn/)
- [Tailwind CSS文档](https://tailwindcss.com/docs)
- [微信小程序API](https://developers.weixin.qq.com/miniprogram/dev/api/)
- [Vue 3文档](https://cn.vuejs.org/)
