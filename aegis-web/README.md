## aegis-web

> aegis manage system .

## 运行

```sh
node app.js
```

## 启动参数

--debug log 采用debug 级别, 默认使用info

--project 使用测试环境（ project.debug.json ）配置 ， 默认使用 project.json

## 构建

静态页面使用webpack ，开发阶段使用

```sh
$ npm run dev
```

上线阶段需要打包打包命令

```sh
$ npm run build
```

### 数据库初始化

db/create.sql 是需要初始化到 mysql 的中。其中默认的超级管理员帐号是 admin ， 密码是 admin

### 配置说明

```sh
{
    "host" : "https://aegis.ivweb.io",   //配额管理服务器地址，用于邮件中的图片展示
    "mysql" : {
           "url" : "mysql://root:root@localhost:3306/badjs" // mysql 地址
    },
    "storage" : {         // 存储服务器的地址， 这里配置badjs-storage 的地址
        "errorMsgTopUrl" : "http://127.0.0.1:9000/errorMsgTop",
      "errorMsgTopCacheUrl" : "http://127.0.0.1:9000/errorMsgTopCache",
        "queryUrl" : "http://127.0.0.1:9000/query"
    },
    "acceptor": {     //aegis-acceptor 模块的地址， 这里用于同步审核通过的业务的id 到接入层进行验证
        "pushWhitelistUrl": "http://127.0.0.1:9001/syncWhitelist"
    },
    "mq" : {       // aegis-mq 的地址
        "url" : "tcp://127.0.0.1:10000",
        "subscribe" : "aegis"     // 跟 aegis-aceptor 中的subscribe 对应
         "module": "axon"      // 指定 mq 模块， 
    },
    "email": {      // 发送 email 配置
        "homepage": "https://aegis.ivweb.io",  // 邮件中的 快捷入口
        "from": "noreply-aegis@demo.com",                    //邮件中的发送者名字
        "smtp": "smtp.demo.com",                             // smtp 服务器
        "emailSuffix" : "@demo.com",         //收件人的邮件后缀，收件人地址 username +  emailSuffix
        "time": "09:00:00",                     // 几点发送邮件
        "top": 20,                            //邮件只发送错误排名的配置的top20
        "module": "email"                 // 邮件发送模块
    }
}
```

### 新增用户

```sql
INSERT INTO `b_user` VALUES (null,'xxx','xxx',0,'xxx@xxx.com','bbe4b161b9dab597e82f5fab7c9bed0d');
```

### sourcemap 文件上传规则

1. 文件名以 .map 结尾。
2. 文件大小小于 20 m。
3. 文件个数小于 10 个。

example：

```javascript
var request = require('request')
var fs = require('fs')

request.post({
    url: 'http://127.0.0.1:8081/upload-sourcemap',
    formData: {
    	projectName: 'test', 
        sourcemap: fs.createReadStream('./jquery.min.map')
    }
}, (err, res) => {
    console.log(res.body)
})

```

其中 projectName 和 sourcemap 两个参数为必传项，projectName 表示当前项目名，sourcemap 为文件流。

