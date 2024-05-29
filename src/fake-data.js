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
    shpping_address: faker.location.streetAddress(),
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

export { generateCustomerData, generateSellerData, generateProductData };
