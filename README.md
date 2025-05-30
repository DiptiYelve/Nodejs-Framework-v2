# Framework-NodeJS - SmartinfoLogiks

A mordern NodeJS framework for simplifying and accelerating NodeJS development and adding low code features. 

This is derived from earlier works - https://github.com/SmartinfoLogiks/Boilerplate-nodejs-api

This framework is being used by SmartinfoLogiks new Development Studio and ADS

### Installation
+ Clone the repo
+ Install using npm install
+ Create a app/config.js from app/config_sample.js
+ Update the paramaters in app/config.js
+ Done, now start using npm start. 

This should give you a basic api at 8888 (If you have not changed the port). Hit the URL printed on Console and verify if its running.

### SQL migration:

#### Step 1: Create Migration.


``` shell
    cd app/database
    npx sequelize-cli migration:generate --name <operation-tablename>
```

This command creates a new migration file in the migrations directory. Define Schema Changes. 
Edit the generated migration file (e.g., migrations/timestamp-operation-tablename.js) to define the schema changes.

#### Step 2: Run Migrations.


``` shell
    npx sequelize-cli db:migrate
```

This command executes all pending migrations, updating the database schema. 

---

### Extras:

#### Undo Migrations.


``` shell
    npx sequelize-cli db:migrate:undo
```

This command reverts the last executed migration. 

#### Undo All Migrations.


``` shell
    npx sequelize-cli db:migrate:undo:all
```

This command reverts all executed migrations.


``` shell
    npx sequelize-cli db:migrate:undo:all --to XXXXXXXXXXXXXX-example.js
```

This command reverts all executed migrations to their original file back (Recommended to avoid any potential errors). 

---

### Reference
+ http://restify.com/docs/home/
