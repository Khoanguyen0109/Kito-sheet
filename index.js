const axios = require('axios').default;
const qs = require('qs');
require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { format } = require('date-fns');
const { getDoc, sleep, authConfig } = require('./utils');
const {
  getTotalProducts,
  getTotalInvoice,
  getProducts,
  getInvoice,
  getInvoiceDetail,
} = require('./api');

let accessToken;
let authHeader;
let doc;
let doc2;
let doc3;

const initProduct = async (page) => {
  try {
    const sheet = doc.sheetsByIndex[0];
    const products = await getProducts(authHeader, page);
    const storage = [];

    products.map((product) => {
      product.inventories.map((inventory) => {
        const productData = {
          ...product,
          ...inventory,
          modifiedDate: product.modifiedDate
            ? format(new Date(product.modifiedDate), 'dd/MM/yyyy , H:mm:ss')
            : '',
          createdDate: format(
            new Date(product.createdDate),
            'dd/MM/yyyy , H:mm:ss'
          ),
        };
        storage.push(productData);
      });
    });

    await sheet.addRows(storage);
  } catch (error) {
    console.log('error', error);
  }
};

const initInvoice = async (page) => {
  try {
    const sheet = doc2.sheetsByIndex[0];
    const sheetDetail = doc3.sheetsByIndex[0];

    const invoices = await getInvoice(authHeader, page);
    const storage = [];
    const storageDetail = [];
    invoices.map((invoice) => {
      const { statusValue, ...restPayment } = invoice?.payment?.[0] ?? {};
      const invoiceData = {
        ...invoice,
        ...restPayment,
        paymentStatusValue: statusValue,
        purchaseDate: format(
          new Date(invoice.purchaseDate),
          'dd/MM/yyyy , H:mm:ss'
        ),
        createdTimeStamp: new Date(invoice.createdDate).getTime(),
        modifiedTimeStamp: initInvoice.modifiedDate
          ? new Date(invoice.createdDate).getTime()
          : '',
        createdDate: format(
          new Date(invoice.createdDate),
          'dd/MM/yyyy , H:mm:ss'
        ),
        modifiedDate: invoice.modifiedDate
          ? format(new Date(invoice.modifiedDate), 'dd/MM/yyyy , H:mm:ss')
          : '',
        ...invoice.invoiceDelivery,
        partnerDeliveryName: invoice?.invoiceDelivery?.partnerDelivery.name,
        partnerDeliveryEmail: invoice?.invoiceDelivery?.partnerDelivery.code,
      };
      invoice.invoiceDetails.map((detail) => {
        const dataDetail = {
          idInvoice: invoice.id,
          ...detail,
          // productBatchExpireId: detail.productBatchExpire?.id,
          // productBatchExpireName: detail.productBatchExpire?.batchName,
          // productBatchExpireCreatedDate: format(
          //   new Date(detail?.productBatchExpire?.createdDate),
          //   'dd/MM/yyyy , H:mm:ss'
          // ),
          // productBatchExpireDate: format(
          //   new Date(detail?.productBatchExpire?.expireDate),
          //   'dd/MM/yyyy , H:mm:ss'
          // ),
          createdDate: format(
            new Date(invoice.createdDate),
            'dd/MM/yyyy , H:mm:ss'
          ),
          modifiedDate: invoice.modifiedDate
            ? format(new Date(invoice.modifiedDate), 'dd/MM/yyyy , H:mm:ss')
            : '',
        };
        storageDetail.push(dataDetail);
      });
      storage.push(invoiceData);
    });
    await sheet.addRows(storage);
    await sheetDetail.addRows(storageDetail);
  } catch (error) {
    console.log('error', error);
  }
};

const doJob = async () => {
  const start = Date.now();

  try {
    const id = '1Q2VJKuSMh6WI-TPIi1v1fPxDx8ZeY5i92lhYdV_I6FA';
    const data = await axios.get(
      'https://script.google.com/macros/s/AKfycbzwIkiHFVQ4IPoO-ufXwrxm4bVNgblTy4RViHXq1shvOtQfF6P-5va1cTyNySdcaOWs/exec'
    );
    const { id_sheet_1, id_sheet_2, id_sheet_3, client_email, private_key } =
      data.data.data[0];
    doc = await getDoc(id_sheet_1, client_email, private_key);
    const auth = await axios(authConfig);
    accessToken = auth.data.access_token;
    console.log('accessToken', accessToken);
    console.log('id_sheet_3', id_sheet_3);
    authHeader = {
      headers: {
        Authorization: 'Bearer ' + accessToken, //the token is a variable which holds the token
        Retailer: 'denio',
      },
    };
    sleep(1000);
    const [total, totalInvoice] = await Promise.all([
      getTotalProducts(authHeader),
      getTotalInvoice(authHeader),
    ]);
    console.log('getTotalProducts', total);
    console.log('getTotalInvoice', totalInvoice);

    const PRODUCT_PER_PAGE = 100;
    const page = Math.ceil(total / PRODUCT_PER_PAGE);
    const pageInvoice = Math.ceil(totalInvoice / PRODUCT_PER_PAGE);

    const sheet = doc.sheetsByIndex[0];
    await Promise.all([sheet.clearRows()]);

    for (let i = 0; i <= page; i++) {
      await initProduct(i);
    }
    // doc2 = await getDoc(id_sheet_2, client_email, private_key);
    // doc3 = await getDoc(id_sheet_3, client_email, private_key);

    // for (let i = 1; i <= pageInvoice; i++) {
    //   await initInvoice(i);
    // }
  } catch (error) {
    console.log('error', error);
  }
  const end = Date.now();
  const duration = end - start;
  console.log(`Call to doSomething took ${duration} milliseconds`);
  process.exit(1);
};

doJob();
