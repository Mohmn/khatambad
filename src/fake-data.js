import {  faker } from "@faker-js/faker";


function generateSellerData() {
    const data =  {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        sellingLienceKey: faker.phone.imei(),
    }

    return Object.values(data);
}

function generateCustomerData() {
    const data = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        shppingAddress: faker.location.streetAddress(),
        pincode: faker.location.zipCode(),
    }
    return Object.values(data);
}

function generateProductData() {
    const randomLength = Math.floor(Math.random() * 5) + 1;
    const data = {
        // name: faker.commerce.product(),
        description: faker.commerce.productDescription(),
        imageUrls: [Array.from({ length: randomLength }, () => faker.image.url())],
    }
    return Object.values(data);
}



export {
    generateCustomerData,
    generateSellerData,
    generateProductData,
}