#!/bin/bash

# Smart CRM v2.2.0 自动化部署脚本
# 使用方法: ./deploy.sh [docker|traditional|local]

set -e  # 遇到错误立即停止

echo "🚀 Smart CRM v2.2.0 部署脚本"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 部署方式
DEPLOY_MODE=${1:-docker}

# 检查环境变量文件
check_env() {
    if [ ! -f ".env.production" ]; then
        echo -e "${YELLOW}⚠️  未找到 .env.production 文件${NC}"
        echo "正在从模板创建..."
        cp .env.example .env.production
        echo -e "${RED}请编辑 .env.production 文件，填入您的 Supabase 配置：${NC}"
        echo "  VITE_SUPABASE_URL=your_supabase_url"
        echo "  VITE_SUPABASE_ANON_KEY=your_anon_key"
        echo ""
        echo "配置完成后，请重新运行此脚本"
        exit 1
    fi
    echo -e "${GREEN}✓ 环境配置文件已就绪${NC}"
}

# Docker 部署
deploy_docker() {
    echo "📦 使用 Docker 部署..."

    # 检查 Docker 是否安装
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
        echo "访问: https://docs.docker.com/get-docker/"
        exit 1
    fi

    # 构建镜像
    echo "🔨 构建 Docker 镜像..."
    docker build -t smart-crm:v2.2.0 -t smart-crm:latest .

    # 停止旧容器（如果存在）
    echo "🛑 停止旧容器..."
    docker stop smart-crm 2>/dev/null || true
    docker rm smart-crm 2>/dev/null || true

    # 运行新容器
    echo "🚀 启动新容器..."
    docker run -d \
        --name smart-crm \
        -p 80:80 \
        --env-file .env.production \
        --restart unless-stopped \
        smart-crm:latest

    echo -e "${GREEN}✅ Docker 部署完成！${NC}"
    echo "访问: http://localhost"
}

# 传统部署（需要 nginx）
deploy_traditional() {
    echo "🌐 使用传统方式部署..."

    # 构建项目
    echo "🔨 构建生产版本..."
    npm run build

    # 检查 nginx 目录
    NGINX_ROOT="/var/www/smart-crm"
    if [ ! -d "$NGINX_ROOT" ]; then
        echo "创建部署目录..."
        sudo mkdir -p $NGINX_ROOT
    fi

    # 复制文件
    echo "📋 复制文件到 nginx..."
    sudo cp -r dist/* $NGINX_ROOT/
    sudo chown -R www-data:www-data $NGINX_ROOT

    # 配置 nginx
    echo "⚙️  配置 nginx..."
    sudo cp nginx.conf /etc/nginx/sites-available/smart-crm
    sudo ln -sf /etc/nginx/sites-available/smart-crm /etc/nginx/sites-enabled/

    # 重启 nginx
    echo "🔄 重启 nginx..."
    sudo nginx -t && sudo systemctl reload nginx

    echo -e "${GREEN}✅ 传统部署完成！${NC}"
    echo "访问: http://your-server-ip"
}

# 本地预览
deploy_local() {
    echo "💻 本地预览模式..."

    # 构建
    echo "🔨 构建项目..."
    npm run build

    # 启动预览服务器
    echo "🌐 启动预览服务器..."
    npm run preview
}

# 部署后检查
post_deploy_check() {
    echo ""
    echo "📋 部署后检查清单："
    echo "  □ 访问系统首页，确认加载正常"
    echo "  □ 尝试登录功能"
    echo "  □ 检查控制台是否有错误"
    echo "  □ 验证 Supabase 连接"
    echo ""
    echo "🔧 常用命令："
    if [ "$DEPLOY_MODE" = "docker" ]; then
        echo "  查看日志: docker logs smart-crm"
        echo "  进入容器: docker exec -it smart-crm /bin/sh"
        echo "  停止服务: docker stop smart-crm"
        echo "  重启服务: docker restart smart-crm"
    else
        echo "  查看日志: sudo tail -f /var/log/nginx/error.log"
        echo "  重启服务: sudo systemctl restart nginx"
    fi
}

# 主流程
echo "部署模式: $DEPLOY_MODE"
echo ""

# 检查环境变量
check_env

# 根据模式执行部署
case $DEPLOY_MODE in
    docker)
        deploy_docker
        ;;
    traditional)
        deploy_traditional
        ;;
    local)
        deploy_local
        ;;
    *)
        echo -e "${RED}❌ 未知的部署模式: $DEPLOY_MODE${NC}"
        echo "使用方法: ./deploy.sh [docker|traditional|local]"
        exit 1
        ;;
esac

# 部署后检查
if [ "$DEPLOY_MODE" != "local" ]; then
    post_deploy_check
fi

echo ""
echo "🎉 部署脚本执行完成！"
echo "如有问题，请查看文档: DEPLOYMENT_GUIDE.md"