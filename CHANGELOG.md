# CHANGELOG


## 0.8.0
- **FIXED** 修复新版接口导致无法下载的问题。

## 0.7.5
- **FIXED** 修正加入secret token后老版aria RPC无法使用的问题。

## 0.7.4
- **IMPROVED** 去掉了ARIA RPC的HTTP用户名/密码验证，改用推荐的Secret token验证。

## 0.7.3
- **FIXED** 迅雷禁掉了magnet接口，使用自建接口 [#19](https://github.com/rhyzx/xuanfeng-userscript/issues/19)

## 0.7.2
- **FIXED** 百度云开始收费导致磁力链解析服务失效，迁移到gae

## 0.7.1
- **FIXED** bt文件夹折叠修复

## 0.7.0
- **NEW** 解除了下载限速 thanks [@4023](https://userscripts.org/users/381599)

## 0.6.3
- **FIXED** 导出失效修复

## 0.6.2
- **FIXED** #13 修复了官方md5库改动导致自动登录失效并无限载入资源的问题

## 0.6.1
- **FIXED** magnet修复


## 0.6.0
最近官方更新了代码导致导出功能坏掉了所以先紧急发布0.6版本

- **NEW** orbit导出
- **TODO** bt文件夹折叠也跟着坏掉了待下个修复
- **TODO** magnet也坏了是因为 @binux 那边的的接口出问题了~ magnet比较重要 所以会尽快解决
