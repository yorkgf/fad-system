/**
 * 分页查询辅助函数
 * 统一处理分页逻辑，消除代码重复
 * @param {MongoCollection} collection - MongoDB 集合
 * @param {Object} filter - 查询条件
 * @param {Object} sort - 排序条件
 * @param {Number} page - 页码 (从1开始)
 * @param {Number} pageSize - 每页数量
 * @returns {Promise<[Array, Number]>} [记录列表, 总数]
 */
async function paginate(collection, filter, sort, page = 1, pageSize = 20) {
  const skip = (parseInt(page) - 1) * parseInt(pageSize)
  const limit = parseInt(pageSize)

  const [records, total] = await Promise.all([
    collection.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
    collection.countDocuments(filter)
  ])

  return [records, total]
}

module.exports = { paginate }
