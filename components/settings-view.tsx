'use client';
import { LogOut, RotateCcw, Settings } from 'lucide-react';
import { Button } from './ui/button';
export function SettingsView({
  onReset,
  onLogout,
  production = false,
}: {
  onReset: () => void;
  onLogout: () => void;
  production?: boolean;
}) {
  return (
    <div className="page-stack settings-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">设置</div>
          <h1>我的</h1>
          <p>管理个人信息和当前工作环境。</p>
        </div>
      </div>
      <section className="surface settings-card">
        <div className="section-heading">
          <div>
            <h2>
              <Settings />
              {production ? '账号与登录' : '演示设置'}
            </h2>
            <p>
              {production
                ? '当前业务数据由服务器统一保存'
                : '仅影响当前浏览器内保存的数据'}
            </p>
          </div>
        </div>
        {!production && (
          <div className="setting-row">
            <div>
              <strong>恢复演示数据</strong>
              <p>清除本地新增和编辑内容，恢复初始客户、月嫂与订单数据。</p>
            </div>
            <Button variant="outline" onClick={onReset}>
              <RotateCcw />
              恢复数据
            </Button>
          </div>
        )}
        <div className="setting-row">
          <div>
            <strong>退出当前账号</strong>
            <p>退出后需要重新验证账号和密码。</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut />
            退出登录
          </Button>
        </div>
      </section>
    </div>
  );
}
