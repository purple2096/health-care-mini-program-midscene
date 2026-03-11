import {
  AndroidAgent,
  AndroidDevice,
  getConnectedDevices,
} from '@midscene/android';
import dotenv from 'dotenv';
import path from 'path';

// 加载 .env 文件
dotenv.config({ path: path.resolve(__dirname, '.env') });

const sleep = (ms: number | undefined) => new Promise((r) => setTimeout(r, ms));
Promise.resolve(
  (async () => {
    const devices = await getConnectedDevices();
    const page = new AndroidDevice(devices[0].udid);

    // 👀 init Midscene agent with custom cache ID and report configuration
    const agent = new AndroidAgent(page, {
      aiActContext:
        'If any location, permission, user agreement, etc. popup, click agree. If login page pops up, close it.',
      cache: {
        id: 'login',  // 设置自定义缓存ID
        strategy: 'read-write'
      }
    });
    await page.connect();
    
    // Midscene TypeScript script for login automation
    // This script handles both logged-in and not-logged-in scenarios

    // Step 0: Open WeChat app - 添加打开微信的步骤
    await agent.aiAct('在手机桌面上找到并点击微信应用图标');
    await agent.aiAct('等待微信启动完成');
    
    // Step 1: Open the mini program - 优化指令表述，避免launch误解
    await agent.aiAct('在微信聊天列表中向上滑动，找到"最近"联系人分组');
    await agent.aiAct('在"最近"分组中查找"FSG健康"小程序并点击');
    await agent.aiAct('等待小程序加载完成');
    
    // Step 2: Go to "My" page
    await agent.aiAct('点击底部导航栏"我的"');
    
    // Step 3: Check login status
    const hasLogoutButton = await agent.aiBoolean('页面是否显示"注销"按钮');
    const hasLoginButton = await agent.aiBoolean('页面是否显示"点击登录"按钮');
    
    if (hasLogoutButton) {
      // Already logged in: click home and finish
      await agent.aiAct('点击底部导航栏"首页"');
      return;
    }
    
    if (hasLoginButton) {
      // Not logged in: perform full login flow
      await agent.aiAct('点击"点击登录"按钮');
      await agent.aiAct('点击"手机号登录"链接');
      
      // Input phone number
      await agent.aiAct('点击"请输入手机号码"输入框');
      await agent.aiAct('慢速输入"13742228048"，输完后等待50ms');
      
      // Verify and correct phone number if needed
      const phoneCorrect = await agent.aiBoolean('页面是否正确显示手机号"13742228048"');
      if (!phoneCorrect) {
        await agent.aiAct('删除已输入的号码');
        await agent.aiAct('重新输入"13742228048"');
      }
      
      // Input verification code
      await agent.aiAct('点击"请输入验证码"输入框');
      await agent.aiAct('输入"1"');
      
      // Check agreement
      await agent.aiAct('点击"我已阅读"前方的小圆圈图标');
      
      // Click login button
      await agent.aiAct('点击蓝色底"登录"按钮');
      
      // Verify successful login
      await agent.aiAssert('页面显示"FSG健康管理"');
    }
    
    // 确保报告正确生成和保存
    await agent.flushCache();
  })()
);