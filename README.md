# # babel-plugin-flavors
支持构建React Native多版本系列应用(类似Android Studio Flavors功能)
(只支持配置js层, 不支持原生层的)
原生层解决方案(相关信息,自行百度)
 * Android 使用Gradle的Flavors配置方案
 * iOS使用xcode的Targets配置方案

应该插件依赖```babel-plugin-module-alias```

使用应该插件的相关约定
1.  flavor代码存放方式1:
    ```
    xxx.flavor.js
    ```
    flavor代码存放方式1:
    添加src的兄弟节点```src-flavor```
    并与src相同的文件夹结构存在文件```src/other/xxx.js```
2. flavor中使用的路径都是别名名称(用babel-plugin-module-alias配置的别名)的相对路径, ```不可使用相对当前文件的相对路径```

运行项目
```
FLAVOR=custom npm start
```



插件的原理:
重写导入的文件的路径,

原本的导入, 检查是否存在Flavor版本, 存在替换导入的路径





