# Asset Spec

> 资产中央化定义。**新增资产类型 = 加一个 yaml**，路由 / 数据库 / 前端表单全部自动适配。

灵感来源：[ArcReel `lib/asset_types.py`](https://github.com/ArcReel/ArcReel) 的 `ASSET_SPECS` 设计。

## 当前 Spec

| Spec | 用途 | 跨项目共享 |
|---|---|---|
| [`character.yaml`](./character.yaml) | 角色（含 6 层身份锚点 + 衣橱） | ✅ |
| [`scene.yaml`](./scene.yaml) | 场景 | ✅ |
| [`prop.yaml`](./prop.yaml) | 道具 | ✅ |
| [`clue.yaml`](./clue.yaml) | 线索（跨镜追踪关键元素） | ❌（通常项目专属） |

## 加载

```python
# 后端示意
from packages.asset_spec import load_spec

spec = load_spec("character")
# spec.sheet_fields
# spec.file_layout
# spec.patch_whitelist
# spec.consistency_check
```

## 新增资产类型示例

需要"音效"作为资产？加一个 `sound_asset.yaml` 即可。

```yaml
asset_type: sound_asset
storage_bucket: sounds
file_layout:
  audio_file: sound.wav
  meta: meta.json

sheet_fields:
  name: { type: string, required: true }
  category: { type: enum, values: [sfx, music, ambient] }
  duration_sec: { type: number }
  ...
```

无需改路由代码 / 数据库迁移 / 前端表单字段。

## 字段类型

| Type | 说明 |
|---|---|
| string | 普通字符串 |
| text | 多行文本（可含 min/max length） |
| enum | 枚举（带 values 列表） |
| array<T> | 数组 |
| object | 嵌套对象（带 fields） |
| int / number | 数字 |
| file_path | 文件路径（自动 sandbox 校验） |

## 关键约定

| 字段 | 含义 |
|---|---|
| `required: true` | 必填字段 |
| `unique_per_project` | 项目内唯一 |
| `patch_whitelist` | 允许 PATCH 修改的字段集合（防止误改身份关键字段） |
| `set_by: <skill-id>` | 该字段由特定 Skill 写入（路由层校验） |
| `shareable_in_global_library` | 是否纳入全局资产库（跨项目复用） |
| `consistency_check` | 一致性校验阈值（用于 06-character-designer / 08-keyframe-generator） |
