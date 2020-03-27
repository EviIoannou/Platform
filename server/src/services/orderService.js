import xlsx from 'xlsx';
import fs from 'fs';
import { createOrder, getOrders, claimOrder } from '../models/orderModel';

export async function orderCreationService(req) {
  if (typeof req.file === 'undefined' || req.file === null) {
    return { error: 'No file was uploaded' };
  }

  const file = xlsx.readFile(req.file.path);
  const sheets = file.SheetNames;
  const rawData = xlsx.utils.sheet_to_json(file.Sheets[sheets[0]]);
  fs.unlink(req.file.path, (err) => {
    if (err) {
      throw err;
    }
  });

  const data = {};
  const models = [];
  let errorText = '';

  rawData.forEach((row) => {
    const tempData = {};
    if (typeof row['Name of product'] !== 'undefined' && row['Name of product'] !== null) {
      tempData.name = row['Name of product'];
    } else {
      errorText = 'At least 1 missing name';
    }
    if (typeof row['Store Link'] !== 'undefined' && row['Store Link'] !== null) {
      tempData.link = row['Store Link'];
    } else {
      errorText = 'At least 1 missing link';
    }
    if (typeof row['Color/Material'] !== 'undefined' && row['Color/Material'] !== null) {
      tempData.color = row['Color/Material'];
    }
    models.push(tempData);
  });

  if (errorText !== '') {
    return { error: errorText };
  }

  data.clientid = req.session.userid;

  const parsedModels = {};

  models.forEach((x) => {
    if (x && x.name) {
      parsedModels[x.name] = parsedModels[x.name] || { name: x.name, products: [] };
      parsedModels[x.name].products.push({
        color: x.color,
        link: x.link,
      });
    }
  });

  data.models = parsedModels;
  const res = await createOrder(data);
  return res;
}

export async function getOrdersService() {
  return getOrders();
}

export async function claimOrderService(orderid, userid) {
  const success = await claimOrder(orderid, userid);
  if (!success) {
    return { error: 'No such order' };
  }
  return { status: 'Success' };
}
