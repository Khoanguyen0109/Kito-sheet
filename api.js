const axios = require('axios').default;

const getProducts = async (authHeader, page) => {
  const itemPerPage = 100;
  const offset = (page - 1) * itemPerPage + 1;
  const res = await axios.get('https://public.kiotapi.com/products', {
    ...authHeader,
    params: {
      pageSize: itemPerPage,
      currentItem: offset,
      orderBy: 'name',
      orderDirection: 'asc',
      hierachicalData: true,
      includeInventory: true,
      includePricebook: true,
      IncludeSerials: true,
      IncludeBatchExpires: true,
      includeQuantity: true,
    },
  });
  const products = res.data.data;
  return products;
};

const getTotalProducts = async (authHeader) => {
  const res = await axios.get('https://public.kiotapi.com/products', {
    ...authHeader,
  });
  return res.data.total;
};

const getInvoice = async (authHeader, page, params) => {
  const itemPerPage = 100;
  const offset = (page - 1) * itemPerPage + 1;
  const res = await axios.get('https://public.kiotapi.com/invoices', {
    ...authHeader,
    params: {
      pageSize: itemPerPage,
      currentItem: offset,
      orderBy: 'createdDate',
      orderDirection: 'asc',
      includePayment: true,
      includeInvoiceDelivery: true,
      ...params,
    },
  });
  return res.data.data;
};
const getTotalInvoice = async (authHeader, params) => {
  const res = await axios.get('https://public.kiotapi.com/invoices', {
    ...authHeader,
    params: params,
  });
  return res.data.total;
};

module.exports = {
  getProducts,
  getInvoice,
  getTotalInvoice,
  getTotalProducts,
};