### YAML 版本（简单场景）
```bash
midscene --files ./login.yaml ./book_standard.yaml
```





<!-- 解决步骤
跳过 scrcpy 下载：

bash
set SKIP_SCRCPY_DOWNLOAD=true
手动构建核心依赖包：

bash
cd packages/core && pnpm run build
cd packages/android && pnpm run build  
cd packages/playground && pnpm run build
重新执行完整安装：

bash
set SKIP_SCRCPY_DOWNLOAD=true && pnpm install -->