
# Database Populator

This Node.js script helps developers fill databases with data quickly for testing and performance purposes. The script creates necessary database tables, helper functions, and populates the tables with generated fake data.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Database Schema](#database-schema)
- [Helper Functions](#helper-functions)
- [Data Generation](#data-generation)
- [Configuration](#configuration)
- [Notes](#notes)
- [License](#license)

## Installation

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd <repository-directory>
   Install the dependencies:
   npm install
    ```

2 Set up the environment variables in a .env file:
```
    Copy code
    DATABASE_PORT=<your-database-port>
    DATABASE_PASSWORD=<your-database-password>
    DATABASE_USER=<your-database-username>
    DATABASE_NAME=<your-database-name>
    DATABASE_HOST=<your-database-host>
```

## Usage
Start the Docker container for the database:

```sh
docker-compose up -d
Run the script to create tables, helper functions, and populate the database:
node index.js
```


**Database Schema**
```
The script can either create new tables based on the provided
createTableQueries or use existing tables that you might have in your database.
```
**Helper Functions**
```
The script creates several helper functions in the database for:

Retrieving foreign key table names.
Retrieving column names.
Retrieving unique column names from a table.
Checking if a column is a foreign key.
Data Generation
The script uses the @faker-js/faker library to generate fake data for the tables.
```

**Data Generation Functions**
```
Refer to fake-data.js for the data generation functions. These functions return key-value pairs for non-foreign key attributes. The script handles the filling of foreign key attributes automatically.
```

The script uses **topological sorting** to determine the order of table creation, so you don’t need to worry about it. Currently, **the script does not handle circular references in foreign keys**. This will be fixed in future updates.

Configuration
```
The script allows configuring the number of rows to generate and the batch size for populating data. These can be adjusted in the index.js file.
```

## Notes
The script only works with **PostgreSQL** for now. Support for other databases will be added in the future.

## License
This project is licensed under the **MIT** License.

## Acknowledgments
I came across Arnav Gupta's(https://x.com/championswimmer) tweett(https://x.com/championswimmer/status/1789356528421486798)  and found it quite interesting. I immediately started working on it, focusing first on database fundamentals. While implementing the e-commerce aspect, the idea to automate the process struck me, leading to the creation of this project. Serendipitously , this project covers every aspect of the roadmap, including concurrency, databases, and utilities.