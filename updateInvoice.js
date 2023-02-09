const axios = require('axios').default;
const qs = require('qs');
require('dotenv').config();
const { format, startOfYear, endOfYear } = require('date-fns');
const { getDoc, authConfig, sleep } = require('./utils');
const { getInvoice, getTotalInvoice } = require('./api');

const addNewInvoice = async () => {
  const start = Date.now();

  try {
    const id = '1Q2VJKuSMh6WI-TPIi1v1fPxDx8ZeY5i92lhYdV_I6FA';

    const doc = await getDoc(id);
    const auth = await axios(authConfig);
    const accessToken = auth.data.access_token;
    const authHeader = {
      headers: {
        Authorization: 'Bearer ' + accessToken, //the token is a variable which holds the token
        Retailer: 'denio',
      },
    };
    sleep(1000);
    const sheet = doc.sheetsByIndex[1];
    const totalInvoice = await getTotalInvoice(authHeader, {
      fromPurchaseDate: startOfYear(new Date()),
      toPurchaseDate: endOfYear(new Date()),
    });
    console.log('totalInvoice :>> ', totalInvoice);
    const PRODUCT_PER_PAGE = 100;

    const pageInvoice = Math.ceil(totalInvoice / PRODUCT_PER_PAGE);
    const rows = await sheet.getRows();
    const rowMap = new Map();
    for (let i = 0; i <= rows.length; i++) {
      if (rows[i]?.id) {
        rowMap.set(rows[i]?.id, { ...rows[i], index: rows[i]._rowNumber });
      }
    }
    const arr = [];
    for (let i = 1; i <= pageInvoice; i++) {
      const invoices = await getInvoice(authHeader, i, {
        fromPurchaseDate: startOfYear(new Date()),
        toPurchaseDate: endOfYear(new Date()),
      });
      invoices.map((invoice) => {
        const invoiceRow = rowMap.get(invoice.id);
        if (
          invoiceRow &&
          invoiceRow.modifiedDate &&
          new Date(invoice.modifiedDate).getTime() !==
            invoiceRow.modifiedTimeStamp
        ) {
          const invoiceData = {
            ...invoice,
            ...restPayment,
            paymentStatusValue: statusValue,
            purchaseDate: format(
              new Date(invoice.purchaseDate),
              'dd/MM/yyyy , H:mm:ss'
            ),
            createdTimeStamp: new Date(invoice.createdDate).getTime(),
            modifiedTimeStamp: invoice.modifiedDate
              ? new Date(invoice.createdDate).getTime()
              : '',

            ...invoice.invoiceDelivery,
            partnerDeliveryName: invoice?.invoiceDelivery?.partnerDelivery.name,
            partnerDeliveryEmail:
              invoice?.invoiceDelivery?.partnerDelivery.code,
          };
          console.log('invoiceRow.index :>> ', invoiceRow.index);
          rows[invoiceRow.index] = invoiceData;
          arr.push(rows[invoiceRow.index].save());
        }
      });
      await Promise.all(arr);
    }
    console.log('arr :>> ', arr);
  } catch (error) {
    console.log('error', error);
  }
  const end = Date.now();
  const duration = end - start;
  console.log(`Call to doSomething took ${duration} milliseconds`);
};

addNewInvoice();
