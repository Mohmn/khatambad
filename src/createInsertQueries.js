



// returns "($1, $2), ($3, $4), ($5, $6)" 
function expandValues(maxVals, extendSize = 1) {
    let str = '';
    for (let i = 0; i < extendSize; i++) {
        str += '('
        for (let j = i*maxVals; j < maxVals*(i+1); j++) {
            const isLastIndex = j === maxVals*(i+1)-1;
            str += isLastIndex ? `$${j+1}` : `$${j+1},`;

        }
        const isLastIndex = i === extendSize - 1;

        str += isLastIndex ? ')' : '),';
    }
    return str;
}


function getSellerInsertQuery(batchSize = 1) {
    // const valuesString = 

    for (let i = 0; i < batchSize; i++)
        return `
        INSERT INTO Seller (name, email, selling_license_key)
        VALUES${expandValues(3, batchSize)}
        ON CONFLICT (email) do nothing
    `;
}

function getCustomerInsertQuery(batchSize = 1) {
    return `
        INSERT INTO Customer (name, email, shipping_address,pincode)
        VALUES${expandValues(4, batchSize)}
        ON CONFLICT (email) do nothing
    `
}

function getProductInsertQuery(batchSize = 1) {
    return `
        INSERT INTO product (description, image_urls)
        VALUES${expandValues(2, batchSize)}
    `
}

export {
    getCustomerInsertQuery,
    getSellerInsertQuery,
    getProductInsertQuery
}