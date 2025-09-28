# 🚀 Smart CRM 生产环境部署指南

## 📋 目录
1. [前置要求](#前置要求)
2. [环境准备](#环境准备)
3. [部署步骤](#部署步骤)
4. [配置说明](#配置说明)
5. [安全加固](#安全加固)
6. [监控配置](#监控配置)
7. [维护指南](#维护指南)
8. [故障排查](#故障排查)
9. [性能优化](#性能优化)
10. [备份恢复](#备份恢复)

---

## 🔧 前置要求

### 系统要求
- **操作系统**: Ubuntu 20.04 LTS 或更高版本
- **CPU**: 最少 2 核心，推荐 4 核心
- **内存**: 最少 4GB，推荐 8GB
- **磁盘**: 最少 20GB SSD
- **网络**: 稳定的互联网连接

### 软件依赖
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20.x LTS
- Nginx 1.18+
- Git 2.25+

---

## 🌍 环境准备

### 1. 更新系统
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. 安装 Docker
```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 添加当前用户到 docker 组
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. 安装 Node.js
```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 4. 配置防火墙
```bash
# 开放必要端口
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 3000/tcp # 应用端口（开发环境）
sudo ufw enable
```

---

## 📦 部署步骤

### 1. 克隆代码仓库
```bash
git clone https://github.com/your-org/smart-crm.git
cd smart-crm
```

### 2. 配置环境变量
```bash
# 复制生产环境配置
cp .env.production .env

# 编辑配置文件
nano .env
```

**重要配置项：**
```env
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# 安全配置
VITE_ENABLE_HTTPS=true
VITE_SECURE_COOKIES=true

# 监控配置
VITE_ENABLE_MONITORING=true
GRAFANA_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password
```

### 3. 构建应用
```bash
# 安装依赖
npm ci

# 构建生产版本
npm run build
```

### 4. Docker 部署
```bash
# 使用 Docker Compose 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 5. 配置 SSL/TLS（使用 Let's Encrypt）
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo systemctl enable certbot.timer
```

---

## ⚙️ 配置说明

### Nginx 配置
主要配置文件：
- `nginx.conf` - 主配置文件
- `default.conf` - 服务器配置

关键优化：
- **Gzip 压缩**: 已启用，压缩级别 6
- **缓存**: 静态资源缓存 30 天
- **速率限制**: API 100 req/min, Auth 5 req/5min
- **安全头**: CSP, HSTS, XSS Protection 已配置

### Docker 配置
服务架构：
```
smart-crm (主应用) -> Redis (缓存)
    |
    +-> Prometheus (监控)
    +-> Grafana (可视化)
    +-> Loki (日志)
```

### 数据库配置
- 使用 Supabase 托管的 PostgreSQL
- 已启用 RLS (Row Level Security)
- 配置了自动备份

---

## 🔐 安全加固

### 1. 应用安全
```javascript
// 在 src/main.tsx 中启用安全措施
import { initializeSecurity } from './utils/security'

if (import.meta.env.PROD) {
  initializeSecurity()
}
```

### 2. 服务器安全
```bash
# 禁用 root SSH 登录
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# 配置 fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban

# 定期更新
sudo apt update && sudo apt upgrade -y
```

### 3. 数据库安全
- 启用 SSL 连接
- 使用强密码
- 定期轮换密钥
- 限制 IP 访问

---

## 📊 监控配置

### 访问监控面板

#### Grafana
- URL: `http://your-server:3001`
- 用户名: `admin`
- 密码: 在 `.env` 中配置

#### Prometheus
- URL: `http://your-server:9090`

### 关键指标监控
1. **系统指标**
   - CPU 使用率
   - 内存使用率
   - 磁盘 I/O
   - 网络流量

2. **应用指标**
   - 请求速率
   - 响应时间
   - 错误率
   - 活跃用户数

3. **业务指标**
   - 新增客户数
   - 转化率
   - AI 分析准确度

### 告警配置
```yaml
# monitoring/alerts.yml
groups:
  - name: app_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
```

---

## 🛠️ 维护指南

### 日常维护

#### 1. 健康检查
```bash
# 检查应用健康状态
curl http://localhost:8080/health

# 检查所有服务
docker-compose ps
```

#### 2. 日志管理
```bash
# 查看应用日志
docker-compose logs smart-crm -f

# 清理老日志
find ./logs -type f -mtime +30 -delete
```

#### 3. 更新部署
```bash
# 拉取最新代码
git pull origin main

# 重新构建
npm ci && npm run build

# 重启服务
docker-compose down && docker-compose up -d
```

### 定期维护

#### 每周
- 检查磁盘空间
- 审查安全日志
- 更新依赖包

#### 每月
- 性能分析
- 安全扫描
- 数据库优化

#### 每季度
- 容灾演练
- 架构审查
- 成本优化

---

## 🔍 故障排查

### 常见问题

#### 1. 服务无法启动
```bash
# 检查端口占用
sudo lsof -i :80
sudo lsof -i :3000

# 检查 Docker 日志
docker-compose logs --tail=100
```

#### 2. 数据库连接失败
```bash
# 测试数据库连接
npm run test:db

# 检查环境变量
cat .env | grep SUPABASE
```

#### 3. 内存不足
```bash
# 检查内存使用
free -h
docker stats

# 调整 Docker 内存限制
# 编辑 docker-compose.yml
```

### 日志位置
- **应用日志**: `/var/log/nginx/`
- **Docker 日志**: `docker-compose logs`
- **系统日志**: `/var/log/syslog`

---

## ⚡ 性能优化

### 前端优化
1. **代码分割**: 已启用动态导入
2. **图片优化**: 使用 WebP 格式
3. **缓存策略**: Service Worker 已配置
4. **CDN**: 配置 CloudFlare 或阿里云 CDN

### 后端优化
1. **数据库索引**: 确保关键查询有索引
2. **Redis 缓存**: 缓存热点数据
3. **连接池**: 优化数据库连接
4. **负载均衡**: 使用 Nginx 负载均衡

### 监控性能
```bash
# 使用 lighthouse 测试
npx lighthouse https://your-domain.com --output html --output-path ./lighthouse-report.html
```

---

## 💾 备份恢复

### 自动备份
```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/smart-crm"

# 备份数据库
pg_dump $DATABASE_URL > "$BACKUP_DIR/db_$DATE.sql"

# 备份文件
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" ./uploads

# 清理旧备份（保留30天）
find $BACKUP_DIR -type f -mtime +30 -delete
EOF

chmod +x backup.sh

# 添加到 crontab
crontab -e
# 每天凌晨2点执行备份
0 2 * * * /path/to/backup.sh
```

### 恢复流程
```bash
# 恢复数据库
psql $DATABASE_URL < backup.sql

# 恢复文件
tar -xzf files_backup.tar.gz -C ./uploads
```

---

## 📈 扩展部署

### 水平扩展
```yaml
# docker-compose.scale.yml
services:
  smart-crm:
    scale: 3  # 运行3个实例
```

### Kubernetes 部署
```bash
# 使用 Helm Chart
helm install smart-crm ./k8s/helm-chart \
  --set image.tag=latest \
  --set replicas=3 \
  --set ingress.enabled=true \
  --set ingress.host=your-domain.com
```

---

## 🆘 支持与联系

### 技术支持
- 📧 Email: support@smartcrm.com
- 📱 紧急热线: 400-888-8888
- 📝 文档: https://docs.smartcrm.com

### 监控告警
配置告警通知：
```bash
# 配置邮件告警
docker exec -it prometheus sh -c "echo 'alertmanager_config' > /etc/alertmanager/config.yml"

# 配置钉钉/企业微信通知
# 参考 monitoring/alertmanager.yml
```

---

## ✅ 部署检查清单

### 部署前
- [ ] 环境变量已配置
- [ ] SSL 证书已准备
- [ ] 数据库已创建
- [ ] 防火墙规则已设置

### 部署中
- [ ] 代码已拉取
- [ ] 依赖已安装
- [ ] 应用已构建
- [ ] Docker 服务已启动

### 部署后
- [ ] 健康检查通过
- [ ] 监控正常工作
- [ ] 备份已配置
- [ ] 文档已更新

---

## 🎉 完成！

恭喜！Smart CRM 已成功部署到生产环境。

### 快速访问
- 🌐 应用地址: https://your-domain.com
- 📊 监控面板: https://your-domain.com:3001
- 📈 Prometheus: https://your-domain.com:9090

### 下一步
1. 配置域名和 SSL
2. 设置监控告警
3. 配置自动备份
4. 进行性能测试
5. 制定灾难恢复计划

---

**最后更新**: 2024-11-25
**版本**: v2.0.0