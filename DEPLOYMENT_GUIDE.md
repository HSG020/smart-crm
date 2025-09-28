# 🚀 Smart CRM 生产环境部署指南

## 📋 发布前检查清单

### 1. 环境准备 ✓
- [ ] Node.js >= 18.0.0
- [ ] npm >= 9.0.0
- [ ] 生产域名已准备
- [ ] SSL证书已配置
- [ ] CDN服务已配置（可选）

### 2. 数据库准备 ✓
- [ ] Supabase项目已创建
- [ ] 数据库表结构已初始化
- [ ] 必要索引已创建
- [ ] 备份策略已制定

### 3. 环境变量配置 ✓
```bash
# .env.production
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_APP_VERSION=2.2.0
VITE_ENV=production
```

### 4. 代码检查 ✓
- [ ] ESLint检查通过
- [ ] TypeScript编译无错误
- [ ] 单元测试通过
- [ ] E2E测试通过
- [ ] 构建成功

### 5. 安全检查 ✓
- [ ] API密钥已从代码中移除
- [ ] 敏感信息使用环境变量
- [ ] XSS防护已启用
- [ ] CSRF防护已配置
- [ ] 依赖包安全审计通过

## 🔧 部署步骤

### 方式一：Docker部署（推荐）

#### 1. 构建Docker镜像
```bash
# 使用提供的Dockerfile
docker build -t smart-crm:latest .
```

#### 2. 运行容器
```bash
docker run -d \
  --name smart-crm \
  -p 80:80 \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  smart-crm:latest
```

### 方式二：传统部署

#### 1. 安装依赖
```bash
npm install --production
```

#### 2. 构建生产版本
```bash
npm run build
```

#### 3. 部署到服务器
```bash
# 使用nginx配置
cp -r dist/* /var/www/smart-crm/
```

#### 4. Nginx配置示例
```nginx
server {
    listen 80;
    server_name crm.yourdomain.com;

    root /var/www/smart-crm;
    index index.html;

    # 启用gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 缓存策略
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

### 方式三：云平台部署

#### Vercel
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

#### Netlify
```bash
# 安装Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod
```

## 📊 监控与维护

### 1. 性能监控
- 使用Google Analytics或Mixpanel
- 配置错误追踪（Sentry）
- 设置性能预警

### 2. 日志管理
```javascript
// 推荐使用winston或pino
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 3. 备份策略
- 数据库：每日自动备份
- 代码：Git仓库版本管理
- 配置：加密存储重要配置

## 🔄 更新流程

### 1. 蓝绿部署
```bash
# 部署到新环境
./deploy.sh blue

# 切换流量
./switch-traffic.sh blue

# 验证后删除旧环境
./cleanup.sh green
```

### 2. 滚动更新
```bash
# 逐步更新实例
kubectl rolling-update smart-crm --image=smart-crm:v2.2.0
```

## 🚨 故障恢复

### 1. 回滚步骤
```bash
# 快速回滚到上一版本
git revert HEAD
npm run build
./deploy.sh
```

### 2. 数据恢复
```bash
# 从备份恢复数据库
pg_restore -d smart_crm backup_20250928.sql
```

## 📈 性能优化建议

### 1. CDN配置
- 静态资源使用CDN
- 图片使用WebP格式
- 启用HTTP/2

### 2. 缓存策略
- Service Worker离线缓存
- 浏览器缓存优化
- API响应缓存

### 3. 数据库优化
- 添加必要索引
- 定期清理过期数据
- 使用连接池

## 🔐 安全建议

### 1. HTTPS强制
```nginx
server {
    listen 80;
    server_name crm.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 2. 环境隔离
- 开发/测试/生产环境分离
- 不同环境使用不同密钥
- 限制生产环境访问权限

### 3. 定期更新
```bash
# 检查依赖更新
npm audit
npm update

# 修复安全漏洞
npm audit fix
```

## 📝 上线后验证

### 1. 功能验证
- [ ] 用户登录/注册
- [ ] 客户管理CRUD
- [ ] 销售机会流程
- [ ] 回款提醒功能
- [ ] 数据统计展示
- [ ] 工作流自动化

### 2. 性能验证
- [ ] 首页加载 < 3秒
- [ ] API响应 < 500ms
- [ ] 无内存泄漏
- [ ] 移动端兼容

### 3. 安全验证
- [ ] HTTPS正常
- [ ] 认证机制有效
- [ ] 敏感数据加密
- [ ] XSS/CSRF防护

## 📞 支持联系

- 技术支持：tech@smartcrm.com
- 紧急热线：400-XXX-XXXX
- 文档中心：docs.smartcrm.com

---

**文档版本**: v1.0.0
**更新日期**: 2025-09-28
**适用版本**: Smart CRM v2.2.0