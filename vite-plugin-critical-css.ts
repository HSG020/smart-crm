/**
 * Vite 插件：内联关键 CSS
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Plugin } from 'vite';

export function inlineCriticalCSS(): Plugin {
  let criticalCSS = '';

  return {
    name: 'vite-plugin-critical-css',

    buildStart() {
      // 读取关键 CSS 文件
      try {
        const cssPath = resolve(__dirname, 'src/styles/critical.css');
        criticalCSS = readFileSync(cssPath, 'utf-8');

        // 压缩 CSS
        criticalCSS = criticalCSS
          .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
          .replace(/\n/g, '') // 移除换行
          .replace(/\s+/g, ' ') // 压缩空格
          .trim();

        console.log('Critical CSS loaded and minified');
      } catch (error) {
        console.warn('Failed to load critical CSS:', error);
      }
    },

    transformIndexHtml(html) {
      if (!criticalCSS) {
        return html;
      }

      // 在 head 中内联关键 CSS
      const styleTag = `<style id="critical-css">${criticalCSS}</style>`;

      // 添加预加载提示
      const preloadTags = `
        <link rel="preconnect" href="https://tuafkxyvvxtwzqrktkvd.supabase.co">
        <link rel="dns-prefetch" href="https://tuafkxyvvxtwzqrktkvd.supabase.co">
      `;

      // 插入到 head 标签中
      return html
        .replace('</head>', `${styleTag}\n${preloadTags}\n</head>`)
        .replace('<body>', '<body>\n<div id="app-loader" class="app-loader"><div class="app-loader-spinner"></div></div>');
    }
  };
}