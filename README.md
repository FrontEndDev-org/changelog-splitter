# changelog-splitter

✂️ conventional commit changelog markdown splitter 约定式提交更新日志 markdown 切割器

[![code-review](https://github.com/FrontEndDev-org/changelog-splitter/actions/workflows/code-review.yml/badge.svg)](https://github.com/FrontEndDev-org/changelog-splitter/actions/workflows/code-review.yml)
[![dependency-review](https://github.com/FrontEndDev-org/changelog-splitter/actions/workflows/dependency-review.yml/badge.svg)](https://github.com/FrontEndDev-org/changelog-splitter/actions/workflows/dependency-review.yml)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/84458613bb214a8eaa2abecded59392a)](https://app.codacy.com/gh/FrontEndDev-org/changelog-splitter/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/84458613bb214a8eaa2abecded59392a)](https://app.codacy.com/gh/FrontEndDev-org/changelog-splitter/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)
[![npm version](https://badge.fury.io/js/changelog-splitter.svg)](https://npmjs.com/package/changelog-splitter)


# 使用
```shell
npm install -D changelog-splitter
```

假设有一个很长的 CHANGELOG.md，包含了从 1.x 到 4.x 的所有版本信息：

```markdown
# 更新日志

## v4.x.x

...中间有 4.x - 1.x 的版本信息

# 1.x.x
```

同目录必须有 package.json 文件，其内容为：

```json
{
  "name": "my-project",
  "version": "4.5.6"
}
```

```shell
changelog-splitter
```

执行过程中打印如下：

```text
正在进行更新日志文件切割...

解析 [========================================] 100%
引用 [========================================] 100%

更新日志文件变化情况如下（删除标记“-”的文件需要手动删除）：
~ CHANGELOG.md
+ changelogs/v1.x-CHANGELOG.md
+ changelogs/v2.x-CHANGELOG.md
+ changelogs/v3.x-CHANGELOG.md

更新日志切割成功
```

此时的 CHANGELOG.md 里内容如下：

```markdown
# 更新日志

## v4.x.x

...中间只有 4.x 的版本信息，根据 package.json 里的版本号决定

## 其他版本的更新日志
- [v3.x](changelogs/v3.x-CHANGELOG.md)
- [v2.x](changelogs/v2.x-CHANGELOG.md)
- [v1.x](changelogs/v1.x-CHANGELOG.md)
```


# 链接

- [约定式提交](https://www.conventionalcommits.org/zh-hans/v1.0.0/)
