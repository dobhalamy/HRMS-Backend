//@desc COMMON function which can used in
// any controller where we need to implement pagination

const getPaginationSize = (page, size) => {
  const limit = size ? +size : 5
  const offset = page ? page * limit : 0
  return { limit, offset }
}

const getPagingData = (rowData, page, limit) => {
  const { count: totalCount, rows: data } = rowData
  return {
    status: true,
    message: 'success',
    totalCount,
    currentPage: page ? +page : 0,
    totalPages: Math.ceil(totalCount / limit),
    data,
  }
}

module.exports = { getPaginationSize, getPagingData }
