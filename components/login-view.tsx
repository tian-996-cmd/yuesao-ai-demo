'use client';

import { ArrowDown, ArrowRight, CalendarDays, Check, HeartHandshake, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { assetUrl } from '@/lib/asset-url';

export function LoginView({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="portal-login">
      <div className="portal-orbit portal-orbit-one" aria-hidden="true" />
      <div className="portal-orbit portal-orbit-two" aria-hidden="true" />
      <div className="portal-stage">
        <section className="portal-intro" aria-labelledby="login-title">
          <header className="portal-brand">
            <div className="brand-mark"><HeartHandshake /></div>
            <div><strong>月嫂 AI</strong><span>母婴服务机构业务工作台</span></div>
          </header>
          <div className="portal-copy">
            <p className="portal-kicker">日常业务协同</p>
            <h1 id="login-title">客户、月嫂与档期，<br />在这里协同。</h1>
            <p>一个入口，完成需求整理、人员匹配、客户跟进与服务安排。</p>
          </div>
          <div className="business-preview" aria-label="客户匹配业务预览">
            <div className="preview-caption"><span>今日匹配进展</span><em><i /> 信息已同步</em></div>
            <article className="need-preview">
              <div className="preview-icon"><span>王</span></div>
              <div className="preview-main">
                <div className="preview-title"><strong>王女士的服务需求</strong><span>待匹配</span></div>
                <p><CalendarDays /> 11月18日预产 <i /> <MapPin /> 上海 · 浦东</p>
                <div className="preview-tags"><span>预算 ¥15,000–18,000</span><span>月子餐</span><span>母乳经验</span></div>
              </div>
            </article>
            <div className="preview-connector" aria-hidden="true"><span><Sparkles /> 智能匹配</span><ArrowDown /></div>
            <article className="nurse-preview">
              <img src={assetUrl('/demo-media/zhang-profile-thumb.webp')} alt="月嫂张红职业头像" />
              <div className="preview-main">
                <div className="preview-title"><strong>张红</strong><span className="match-score">92% 匹配</span></div>
                <p>金牌月嫂 · 8年经验 · 26单服务</p>
                <div className="preview-tags"><span>新生儿护理</span><span>沟通温和</span><span>月子餐</span></div>
              </div>
              <aside className="availability-preview"><small>最近可上户</small><strong>11月09日</strong><span><Check /> 档期可用</span></aside>
            </article>
            <div className="schedule-preview" aria-label="月嫂近期档期">
              <span><CalendarDays /> 近期档期</span>
              <div><small>10月</small><b className="locked">已锁档</b></div>
              <div><small>11月</small><b className="available">可接单</b></div>
            </div>
          </div>
        </section>
        <section className="portal-access" aria-label="登录区域">
          <div className="login-card portal-login-card">
            <div className="mobile-portal-brand">
              <div className="brand-mark"><HeartHandshake /></div>
              <div><strong>月嫂 AI</strong><span>母婴服务机构业务工作台</span></div>
            </div>
            <p className="portal-kicker">欢迎回来</p>
            <h2>登录工作台</h2>
            <p className="muted">使用演示账号体验当前 Demo</p>
            <form onSubmit={(event) => { event.preventDefault(); onLogin(); }}>
              <label htmlFor="demo-account">账号<Input id="demo-account" defaultValue="wangmin" autoComplete="username" /></label>
              <label htmlFor="demo-password">密码<Input id="demo-password" type="password" defaultValue="demo2026" autoComplete="current-password" /></label>
              <Button type="submit" className="primary-button">进入工作台 <ArrowRight /></Button>
            </form>
            <div className="demo-note"><Check /> 演示账号已预填，无需真实身份验证</div>
          </div>
          <p className="portal-support">业务数据仅用于产品演示 · 本地安全存储</p>
        </section>
      </div>
    </main>
  );
}
