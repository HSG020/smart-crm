import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';

export default function Auth() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;
      message.success('登录成功！');
    } catch (error: any) {
      message.error(error.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (values: any) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
          }
        }
      });

      if (error) throw error;

      // 注册成功后尝试自动登录
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (loginError) {
        message.success('注册成功！请查收邮件确认账号');
      } else {
        message.success('注册成功并已自动登录！');
      }
    } catch (error: any) {
      message.error(error.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <Form onFinish={handleLogin} autoComplete="off">
      <Form.Item
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' }
        ]}
      >
        <Input
          prefix={<MailOutlined />}
          placeholder="邮箱地址"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
        >
          登录
        </Button>
      </Form.Item>
    </Form>
  );

  const signUpForm = (
    <Form onFinish={handleSignUp} autoComplete="off">
      <Form.Item
        name="name"
        rules={[{ required: true, message: '请输入姓名' }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="姓名"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' }
        ]}
      >
        <Input
          prefix={<MailOutlined />}
          placeholder="邮箱地址"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6个字符' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码（至少6个字符）"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
        >
          注册
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">智能CRM系统</h2>
          <p className="mt-2 text-sm text-gray-600">管理客户关系，提升销售效率</p>
        </div>

        <Tabs
          defaultActiveKey="login"
          centered
          items={[
            {
              key: 'login',
              label: '登录',
              children: loginForm
            },
            {
              key: 'signup',
              label: '注册',
              children: signUpForm
            }
          ]}
        />
      </Card>
    </div>
  );
}