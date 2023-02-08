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
    const storage = [];
    const sheet = doc.sheetsByIndex[1];
    const totalInvoice = await getTotalInvoice(authHeader, {
      fromPurchaseDate: startOfYear(new Date()),
      toPurchaseDate: endOfYear(new Date()),
    });
    const PRODUCT_PER_PAGE = 100;

    const pageInvoice = Math.ceil(totalInvoice / PRODUCT_PER_PAGE);
    console.log('totalInvoice :>> ', totalInvoice);
    const rows = await sheet.getRows();
    const newestInvoiceFromSheet = await sheet.getRows({
      offset: rows.length - 1,
      limit: 1,
    });
    console.log('new Date() :>> ', new Date(startOfYear(new Date())));
    if (rows.length === totalInvoice) {
      return;
    }
    for (let i = 1; i <= pageInvoice; i++) {
      const invoices = await getInvoice(authHeader, i, {
        fromPurchaseDate: startOfYear(new Date()),
        toPurchaseDate: endOfYear(new Date()),
      });
      invoices.map((invoice) => {
        console.log('invoice.cre :>> ', invoice.createdDate);
        if (
          new Date(invoice.createdDate).getTime() >=
            newestInvoiceFromSheet[0].createdTimeStamp &&
          invoice.id !== newestInvoiceFromSheet[0].id
        ) {
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
            modifiedTimeStamp: invoice.modifiedDate
              ? new Date(invoice.createdDate).getTime()
              : '',

            ...invoice.invoiceDelivery,
            partnerDeliveryName: invoice?.invoiceDelivery?.partnerDelivery.name,
            partnerDeliveryEmail:
              invoice?.invoiceDelivery?.partnerDelivery.code,
          };
          storage.push(invoiceData);
        }
      });
    }
    if (storage.length > 0) {
      await sheet.addRows(storage);
    }
    const end = Date.now();
    const duration = end - start;
    console.log(`Call to doSomething took ${duration} milliseconds`);
  } catch (error) {
    console.log('error', error);
  }
};

addNewInvoice();
