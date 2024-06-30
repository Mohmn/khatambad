import { faker } from "@faker-js/faker";

function generateSellerData() {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    selling_license_key: faker.phone.imei(),
  };
}

function generateCustomerData() {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    shipping_address: faker.location.streetAddress(),
    pincode: faker.location.zipCode(),
  };
}

function generateProductData() {
  const randomLength = Math.floor(Math.random() * 5) + 1;
  return {
    // name: faker.commerce.product(),
    description: faker.commerce.productDescription(),
    image_urls: [Array.from({ length: randomLength }, () => faker.image.url())],
  };
}

function generateSellerProductData() {
  return {
    price: +faker.commerce.price(),
    // discount: faker.number.int({ min: 1, max: 30 }),
  };
}

function generateCartData() {
  return {
    quantity: faker.number.int({ min: 1, max: 10 }),
    price: +faker.commerce.price({ dec: 4 }),
    discount: parseFloat((faker.number.int({ min: 0, max: 20 }) / 100).toFixed(2)),
  };
}

function generateOrderData() {
  return {
    quantity: faker.number.int({ min: 1, max: 10 }),
    amount: +faker.commerce.price(),
  };
}

export {
  generateCustomerData,
  generateSellerData,
  generateProductData,
  generateSellerProductData,
  generateOrderData,
  generateCartData,
};
